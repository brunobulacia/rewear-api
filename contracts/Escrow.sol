// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReWearEscrow
 * @dev Custodia de fondos para transacciones en el marketplace ReWear.
 *
 * Flujo normal:
 *   1. Comprador llama a createAndFund() con el pago en MATIC → fondos custodiados.
 *   2. Vendedor envía la prenda físicamente.
 *   3. Comprador llama a confirmDelivery() → fondos liberados al vendedor (menos comisión).
 *   4. La plataforma transfiere el NFT pasaporte al comprador (off-chain trigger).
 *
 * Flujo de disputa:
 *   - Comprador llama a openDispute() antes de confirmar entrega.
 *   - La plataforma (owner) resuelve con resolveDispute(tradeId, buyerWins).
 *
 * Timeout:
 *   - Si el comprador no confirma en DELIVERY_TIMEOUT días, la plataforma puede
 *     llamar a confirmDelivery() como owner para liberar los fondos.
 */
contract ReWearEscrow is Ownable, ReentrancyGuard {

    uint256 public commissionBps = 300;          // 3 % en basis points (la asume el vendedor)
    uint256 public constant DELIVERY_TIMEOUT = 7 days;

    // Billetera que recibe automáticamente las comisiones en cada venta ("el jefe").
    // Arranca igual al owner; se puede reapuntar con setFeeRecipient().
    address public feeRecipient;

    enum State { FUNDED, COMPLETED, DISPUTED, REFUNDED }

    struct Trade {
        address payable buyer;
        address payable seller;
        uint256 amount;       // en wei (MATIC)
        State   state;
        uint256 fundedAt;
        string  garmentId;    // UUID off-chain de la prenda
        uint256 nftTokenId;   // Token ID del pasaporte NFT
    }

    // tradeId (bytes32) → Trade
    mapping(bytes32 => Trade) public trades;
    // garmentId → tradeId (previene doble-compra)
    mapping(string => bytes32) public garmentTrade;

    event TradeFunded(
        bytes32 indexed tradeId,
        string  garmentId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event TradeCompleted(bytes32 indexed tradeId, uint256 sellerAmount, uint256 commission);
    event TradeDisputed(bytes32 indexed tradeId, address by);
    event TradeRefunded(bytes32 indexed tradeId);
    event DisputeResolved(bytes32 indexed tradeId, bool buyerWins);
    event FeeRecipientUpdated(address indexed newRecipient);

    constructor(address initialOwner) Ownable(initialOwner) {
        feeRecipient = initialOwner;
    }

    // ─────────────────────────────────────────────────────────────
    //  Acciones del comprador
    // ─────────────────────────────────────────────────────────────

    /**
     * @dev Crea el escrow y deposita el pago en una sola transacción.
     * @param seller      Wallet del vendedor
     * @param garmentId   UUID de la prenda en la base de datos
     * @param nftTokenId  Token ID del NFT pasaporte de la prenda
     * @return tradeId    Identificador único del escrow (bytes32)
     */
    function createAndFund(
        address payable seller,
        string  calldata garmentId,
        uint256 nftTokenId
    ) external payable nonReentrant returns (bytes32 tradeId) {
        require(msg.value > 0,                              "Escrow: monto requerido");
        require(seller != address(0),                       "Escrow: vendedor invalido");
        require(seller != msg.sender,                       "Escrow: comprador = vendedor");
        require(garmentTrade[garmentId] == bytes32(0),      "Escrow: prenda ya en escrow");

        tradeId = keccak256(
            abi.encodePacked(garmentId, msg.sender, seller, block.timestamp)
        );

        trades[tradeId] = Trade({
            buyer:       payable(msg.sender),
            seller:      seller,
            amount:      msg.value,
            state:       State.FUNDED,
            fundedAt:    block.timestamp,
            garmentId:   garmentId,
            nftTokenId:  nftTokenId
        });

        garmentTrade[garmentId] = tradeId;

        emit TradeFunded(tradeId, garmentId, msg.sender, seller, msg.value);
    }

    /**
     * @dev Confirma la entrega y libera fondos al vendedor.
     *      Puede ser llamado por el comprador o por el owner (timeout).
     */
    function confirmDelivery(bytes32 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(
            trade.buyer == msg.sender || msg.sender == owner(),
            "Escrow: no autorizado"
        );
        require(trade.state == State.FUNDED, "Escrow: estado invalido");

        // Si lo llama el owner, verificar que pasó el timeout
        if (msg.sender == owner() && trade.buyer != msg.sender) {
            require(
                block.timestamp >= trade.fundedAt + DELIVERY_TIMEOUT,
                "Escrow: timeout no alcanzado"
            );
        }

        _release(tradeId);
    }

    /**
     * @dev Abre una disputa. Solo el comprador puede hacerlo mientras el estado es FUNDED.
     */
    function openDispute(bytes32 tradeId) external {
        Trade storage trade = trades[tradeId];
        require(trade.buyer == msg.sender, "Escrow: no es el comprador");
        require(trade.state == State.FUNDED, "Escrow: estado invalido");

        trade.state = State.DISPUTED;
        emit TradeDisputed(tradeId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────
    //  Acciones de la plataforma (owner)
    // ─────────────────────────────────────────────────────────────

    /**
     * @dev Resuelve una disputa.
     * @param buyerWins  true → reembolso al comprador | false → fondos al vendedor
     */
    function resolveDispute(bytes32 tradeId, bool buyerWins)
        external
        onlyOwner
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.state == State.DISPUTED, "Escrow: no hay disputa");

        if (buyerWins) {
            trade.state = State.REFUNDED;
            (bool ok,) = trade.buyer.call{value: trade.amount}("");
            require(ok, "Escrow: reembolso fallido");
            emit TradeRefunded(tradeId);
        } else {
            _release(tradeId);
        }

        emit DisputeResolved(tradeId, buyerWins);
    }

    /**
     * @dev Retira las comisiones acumuladas en el contrato.
     */
    function withdrawCommissions() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Escrow: sin comisiones");
        (bool ok,) = payable(owner()).call{value: balance}("");
        require(ok, "Escrow: retiro fallido");
    }

    /**
     * @dev Actualiza el porcentaje de comisión (máximo 10 %).
     */
    function setCommissionBps(uint256 newBps) external onlyOwner {
        require(newBps <= 1000, "Escrow: max 10%");
        commissionBps = newBps;
    }

    /**
     * @dev Reapunta la billetera que recibe las comisiones ("el jefe").
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Escrow: recipient invalido");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    // ─────────────────────────────────────────────────────────────
    //  Vistas
    // ─────────────────────────────────────────────────────────────

    function getTrade(bytes32 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function getTradeByGarment(string calldata garmentId)
        external
        view
        returns (bytes32 tradeId, Trade memory trade)
    {
        tradeId = garmentTrade[garmentId];
        trade   = trades[tradeId];
    }

    // ─────────────────────────────────────────────────────────────
    //  Internos
    // ─────────────────────────────────────────────────────────────

    function _release(bytes32 tradeId) internal {
        Trade storage trade = trades[tradeId];
        trade.state = State.COMPLETED;

        uint256 commission   = (trade.amount * commissionBps) / 10_000;
        uint256 sellerAmount = trade.amount - commission;

        (bool ok,) = trade.seller.call{value: sellerAmount}("");
        require(ok, "Escrow: pago al vendedor fallido");

        // La comisión se transfiere automáticamente al jefe en la misma tx.
        if (commission > 0) {
            (bool okFee,) = payable(feeRecipient).call{value: commission}("");
            require(okFee, "Escrow: pago de comision fallido");
        }

        emit TradeCompleted(tradeId, sellerAmount, commission);
    }

    receive() external payable {}
}
