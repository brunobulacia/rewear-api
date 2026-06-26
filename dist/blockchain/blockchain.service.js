"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const GarmentNFTAbiJson = require("./abi/GarmentNFT.json");
const EscrowAbiJson = require("./abi/Escrow.json");
const GarmentNFTAbi = GarmentNFTAbiJson.default ?? GarmentNFTAbiJson;
const EscrowAbi = EscrowAbiJson.default ?? EscrowAbiJson;
const DEFAULT_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
let BlockchainService = BlockchainService_1 = class BlockchainService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(BlockchainService_1.name);
        this.nftContract = null;
        this.escrowContract = null;
        this.provider = null;
    }
    async onModuleInit() {
        const privateKey = this.config.get('PLATFORM_WALLET_PRIVATE_KEY');
        const nftAddress = this.config.get('NFT_CONTRACT_ADDRESS');
        const escrowAddress = this.config.get('ESCROW_CONTRACT_ADDRESS');
        const rpcUrl = this.config.get('SEPOLIA_RPC') || DEFAULT_RPC;
        if (!privateKey) {
            this.logger.warn('PLATFORM_WALLET_PRIVATE_KEY no configurado. Blockchain deshabilitado.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const blockNumber = await this.provider.getBlockNumber();
            this.logger.log(`Nodo Sepolia OK (${rpcUrl}) — bloque ${blockNumber}`);
            const wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            const balance = await this.provider.getBalance(wallet.address);
            if (balance === 0n) {
                this.logger.warn(`⚠️ Wallet ${wallet.address} SIN fondos de gas — las transacciones fallarán. Usá un faucet de Sepolia.`);
            }
            else {
                this.logger.log(`Wallet ${wallet.address} con ${ethers_1.ethers.formatEther(balance)} ETH de gas`);
            }
            if (nftAddress) {
                this.nftContract = new ethers_1.ethers.Contract(nftAddress, GarmentNFTAbi, wallet);
                this.logger.log(`NFT contract activo → ${nftAddress}`);
            }
            else {
                this.logger.warn('NFT_CONTRACT_ADDRESS no configurado. Minting deshabilitado.');
            }
            if (escrowAddress) {
                this.escrowContract = new ethers_1.ethers.Contract(escrowAddress, EscrowAbi, wallet);
                this.logger.log(`Escrow contract activo → ${escrowAddress}`);
            }
            else {
                this.logger.warn('ESCROW_CONTRACT_ADDRESS no configurado. Escrow deshabilitado.');
            }
        }
        catch (err) {
            this.logger.error(`Error inicializando blockchain service (RPC: ${rpcUrl})`, err);
        }
    }
    get isNftActive() { return this.nftContract !== null; }
    async mintPassport(ownerAddress, garmentId, tokenURI) {
        if (!this.nftContract) {
            this.logger.warn(`Mint saltado para prenda ${garmentId} — contrato no configurado`);
            return null;
        }
        try {
            this.logger.log(`Minteando pasaporte para prenda ${garmentId} → ${ownerAddress}`);
            const tx = await this.nftContract.mintPassport(ownerAddress, garmentId, tokenURI);
            const receipt = await tx.wait();
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = this.nftContract.interface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });
                    if (parsed?.name === 'PassportMinted') {
                        tokenId = parsed.args.tokenId.toString();
                        break;
                    }
                }
                catch { }
            }
            this.logger.log(`✅ NFT #${tokenId} minteado para prenda ${garmentId}`);
            return tokenId;
        }
        catch (err) {
            this.logger.error(`Error minteando NFT para prenda ${garmentId}`, err);
            return null;
        }
    }
    async transferPassport(toAddress, tokenId) {
        if (!this.nftContract) {
            this.logger.warn(`Transfer saltado — contrato NFT no configurado`);
            return false;
        }
        try {
            this.logger.log(`Transfiriendo NFT #${tokenId} → ${toAddress}`);
            const tx = await this.nftContract.transferPassport(toAddress, BigInt(tokenId));
            await tx.wait();
            this.logger.log(`✅ NFT #${tokenId} transferido a ${toAddress}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Error transfiriendo NFT #${tokenId}`, err);
            return false;
        }
    }
    async getNftContractAddress() {
        if (!this.nftContract)
            return null;
        return await this.nftContract.getAddress();
    }
    async getTotalSupply() {
        if (!this.nftContract)
            return 0;
        try {
            return Number(await this.nftContract.totalSupply());
        }
        catch {
            return 0;
        }
    }
    async getTokenHistory(tokenId) {
        if (!this.nftContract)
            return [];
        const logsRpc = process.env.SEPOLIA_LOGS_RPC || 'https://sepolia.gateway.tenderly.co';
        const provider = new ethers_1.ethers.JsonRpcProvider(logsRpc);
        const nft = this.nftContract.connect(provider);
        const latest = await provider.getBlockNumber();
        const WINDOW = 9500;
        const SPAN = 200000;
        const fromStart = Math.max(0, latest - SPAN);
        const filter = nft.filters.Transfer(null, null, BigInt(tokenId));
        const ranges = [];
        for (let to = latest; to >= fromStart; to -= WINDOW) {
            ranges.push([Math.max(fromStart, to - WINDOW + 1), to]);
            if (ranges[ranges.length - 1][0] === fromStart)
                break;
        }
        const raw = [];
        const BATCH = 4;
        for (let i = 0; i < ranges.length; i += BATCH) {
            const chunk = ranges.slice(i, i + BATCH);
            const res = await Promise.all(chunk.map(([from, to]) => nft.queryFilter(filter, from, to).catch(() => {
                this.logger.warn(`queryFilter falló [${from},${to}] para token ${tokenId}`);
                return [];
            })));
            raw.push(...res.flat());
        }
        raw.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);
        const tsCache = {};
        const out = [];
        for (const e of raw) {
            if (!(e.blockNumber in tsCache)) {
                const blk = await provider.getBlock(e.blockNumber);
                tsCache[e.blockNumber] = blk?.timestamp ?? 0;
            }
            const fromAddr = e.args?.[0];
            const toAddr = e.args?.[1];
            out.push({
                type: fromAddr === ethers_1.ethers.ZeroAddress ? 'MINT' : 'TRANSFER',
                from: fromAddr,
                to: toAddr,
                txHash: e.transactionHash,
                blockNumber: e.blockNumber,
                timestamp: tsCache[e.blockNumber],
            });
        }
        return out;
    }
    get isEscrowActive() { return this.escrowContract !== null; }
    async confirmDelivery(tradeId) {
        if (!this.escrowContract) {
            this.logger.warn('confirmDelivery saltado — contrato Escrow no configurado');
            return false;
        }
        try {
            const tx = await this.escrowContract.confirmDelivery(tradeId);
            await tx.wait();
            this.logger.log(`✅ Entrega confirmada on-chain para trade ${tradeId}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Error confirmando entrega para trade ${tradeId}`, err);
            return false;
        }
    }
    async resolveDispute(tradeId, buyerWins) {
        if (!this.escrowContract) {
            this.logger.warn('resolveDispute saltado — contrato Escrow no configurado');
            return false;
        }
        try {
            const tx = await this.escrowContract.resolveDispute(tradeId, buyerWins);
            await tx.wait();
            this.logger.log(`✅ Disputa resuelta para trade ${tradeId} — buyerWins: ${buyerWins}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Error resolviendo disputa para trade ${tradeId}`, err);
            return false;
        }
    }
    async getEscrowContractAddress() {
        if (!this.escrowContract)
            return null;
        return await this.escrowContract.getAddress();
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map