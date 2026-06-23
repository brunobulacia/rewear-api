import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as GarmentNFTAbiJson from './abi/GarmentNFT.json';
import * as EscrowAbiJson from './abi/Escrow.json';

// Los .json de ABI son arrays planos. Según cómo TS los importe pueden venir
// envueltos en `.default`; normalizamos para no pasarle un objeto raro a ethers.
const GarmentNFTAbi = (GarmentNFTAbiJson as any).default ?? GarmentNFTAbiJson;
const EscrowAbi = (EscrowAbiJson as any).default ?? EscrowAbiJson;

// RPC público de Sepolia confiable y sin API key (el mismo enfoque que EduPay).
// rpc.sepolia.org está caído (404) y rompe TODA operación on-chain.
const DEFAULT_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private nftContract: ethers.Contract | null = null;
  private escrowContract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const privateKey       = this.config.get<string>('PLATFORM_WALLET_PRIVATE_KEY');
    const nftAddress       = this.config.get<string>('NFT_CONTRACT_ADDRESS');
    const escrowAddress    = this.config.get<string>('ESCROW_CONTRACT_ADDRESS');
    const rpcUrl           = this.config.get<string>('SEPOLIA_RPC') || DEFAULT_RPC;

    if (!privateKey) {
      this.logger.warn('PLATFORM_WALLET_PRIVATE_KEY no configurado. Blockchain deshabilitado.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Verificar que el nodo responde ANTES de operar. Si el RPC está caído
      // (ej. rpc.sepolia.org devuelve 404), todo mint/escrow fallaría en silencio.
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.log(`Nodo Sepolia OK (${rpcUrl}) — bloque ${blockNumber}`);

      const wallet  = new ethers.Wallet(privateKey, this.provider);
      const balance = await this.provider.getBalance(wallet.address);
      if (balance === 0n) {
        this.logger.warn(
          `⚠️ Wallet ${wallet.address} SIN fondos de gas — las transacciones fallarán. Usá un faucet de Sepolia.`,
        );
      } else {
        this.logger.log(`Wallet ${wallet.address} con ${ethers.formatEther(balance)} ETH de gas`);
      }

      if (nftAddress) {
        this.nftContract = new ethers.Contract(nftAddress, GarmentNFTAbi, wallet);
        this.logger.log(`NFT contract activo → ${nftAddress}`);
      } else {
        this.logger.warn('NFT_CONTRACT_ADDRESS no configurado. Minting deshabilitado.');
      }

      if (escrowAddress) {
        this.escrowContract = new ethers.Contract(escrowAddress, EscrowAbi, wallet);
        this.logger.log(`Escrow contract activo → ${escrowAddress}`);
      } else {
        this.logger.warn('ESCROW_CONTRACT_ADDRESS no configurado. Escrow deshabilitado.');
      }
    } catch (err) {
      this.logger.error(`Error inicializando blockchain service (RPC: ${rpcUrl})`, err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  NFT — GarmentNFT
  // ─────────────────────────────────────────────────────────────

  get isNftActive(): boolean { return this.nftContract !== null; }

  async mintPassport(
    ownerAddress: string,
    garmentId: string,
    tokenURI: string,
  ): Promise<string | null> {
    if (!this.nftContract) {
      this.logger.warn(`Mint saltado para prenda ${garmentId} — contrato no configurado`);
      return null;
    }
    try {
      this.logger.log(`Minteando pasaporte para prenda ${garmentId} → ${ownerAddress}`);
      const tx      = await this.nftContract.mintPassport(ownerAddress, garmentId, tokenURI);
      const receipt = await tx.wait();

      let tokenId: string | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.nftContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === 'PassportMinted') {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch { /* log no relevante */ }
      }

      this.logger.log(`✅ NFT #${tokenId} minteado para prenda ${garmentId}`);
      return tokenId;
    } catch (err) {
      this.logger.error(`Error minteando NFT para prenda ${garmentId}`, err);
      return null;
    }
  }

  /**
   * Transfiere el NFT pasaporte al comprador al completarse la compra.
   */
  async transferPassport(toAddress: string, tokenId: string): Promise<boolean> {
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
    } catch (err) {
      this.logger.error(`Error transfiriendo NFT #${tokenId}`, err);
      return false;
    }
  }

  async getNftContractAddress(): Promise<string | null> {
    if (!this.nftContract) return null;
    return await this.nftContract.getAddress();
  }

  async getTotalSupply(): Promise<number> {
    if (!this.nftContract) return 0;
    try {
      return Number(await this.nftContract.totalSupply());
    } catch { return 0; }
  }

  /**
   * Historial on-chain de un NFT: todas las transferencias por las que pasó
   * (mint + ventas + transferencias), reconstruidas desde los eventos Transfer
   * del estándar ERC-721 filtrados por tokenId. Devuelve la cadena de propietarios.
   */
  async getTokenHistory(tokenId: string): Promise<
    Array<{
      type: 'MINT' | 'TRANSFER';
      from: string;
      to: string;
      txHash: string;
      blockNumber: number;
      timestamp: number;
    }>
  > {
    if (!this.nftContract) return [];

    // Proveedor dedicado para eth_getLogs. El RPC principal (publicnode) no es
    // confiable para getLogs (devuelve errores), así que el historial usa un RPC
    // que sí lo soporta —configurable vía SEPOLIA_LOGS_RPC; por defecto, el
    // gateway de Tenderly—. Las transacciones siguen usando el RPC principal.
    const logsRpc = process.env.SEPOLIA_LOGS_RPC || 'https://sepolia.gateway.tenderly.co';
    const provider = new ethers.JsonRpcProvider(logsRpc);
    const nft = this.nftContract.connect(provider) as ethers.Contract;

    const latest = await provider.getBlockNumber();
    const WINDOW = 9500; // límite seguro de eth_getLogs por consulta
    const SPAN = 200000; // ~27 días hacia atrás (cubre todos los NFTs del proyecto)
    const fromStart = Math.max(0, latest - SPAN);
    const filter = (nft.filters as any).Transfer(null, null, BigInt(tokenId));

    // Construir las ventanas y consultarlas EN PARALELO (mucho más rápido que
    // de forma secuencial: de varios segundos a menos de uno).
    const ranges: Array<[number, number]> = [];
    for (let to = latest; to >= fromStart; to -= WINDOW) {
      ranges.push([Math.max(fromStart, to - WINDOW + 1), to]);
      if (ranges[ranges.length - 1][0] === fromStart) break;
    }
    // Consultar en lotes pequeños (concurrencia moderada): más rápido que de
    // forma secuencial, pero sin saturar el RPC gratuito.
    const raw: any[] = [];
    const BATCH = 4;
    for (let i = 0; i < ranges.length; i += BATCH) {
      const chunk = ranges.slice(i, i + BATCH);
      const res = await Promise.all(
        chunk.map(([from, to]) =>
          nft.queryFilter(filter, from, to).catch(() => {
            this.logger.warn(`queryFilter falló [${from},${to}] para token ${tokenId}`);
            return [] as any[];
          }),
        ),
      );
      raw.push(...res.flat());
    }
    raw.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

    const tsCache: Record<number, number> = {};
    const out = [];
    for (const e of raw) {
      if (!(e.blockNumber in tsCache)) {
        const blk = await provider.getBlock(e.blockNumber);
        tsCache[e.blockNumber] = blk?.timestamp ?? 0;
      }
      const fromAddr = e.args?.[0] as string;
      const toAddr = e.args?.[1] as string;
      out.push({
        type: fromAddr === ethers.ZeroAddress ? ('MINT' as const) : ('TRANSFER' as const),
        from: fromAddr,
        to: toAddr,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: tsCache[e.blockNumber],
      });
    }
    return out;
  }

  // ─────────────────────────────────────────────────────────────
  //  Escrow — ReWearEscrow
  // ─────────────────────────────────────────────────────────────

  get isEscrowActive(): boolean { return this.escrowContract !== null; }

  /**
   * Confirma la entrega desde la plataforma (timeout de 7 días).
   * En el flujo normal, el comprador llama directamente desde el frontend.
   */
  async confirmDelivery(tradeId: string): Promise<boolean> {
    if (!this.escrowContract) {
      this.logger.warn('confirmDelivery saltado — contrato Escrow no configurado');
      return false;
    }
    try {
      const tx = await this.escrowContract.confirmDelivery(tradeId);
      await tx.wait();
      this.logger.log(`✅ Entrega confirmada on-chain para trade ${tradeId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error confirmando entrega para trade ${tradeId}`, err);
      return false;
    }
  }

  /**
   * Resuelve una disputa desde la plataforma (onlyOwner).
   */
  async resolveDispute(tradeId: string, buyerWins: boolean): Promise<boolean> {
    if (!this.escrowContract) {
      this.logger.warn('resolveDispute saltado — contrato Escrow no configurado');
      return false;
    }
    try {
      const tx = await this.escrowContract.resolveDispute(tradeId, buyerWins);
      await tx.wait();
      this.logger.log(`✅ Disputa resuelta para trade ${tradeId} — buyerWins: ${buyerWins}`);
      return true;
    } catch (err) {
      this.logger.error(`Error resolviendo disputa para trade ${tradeId}`, err);
      return false;
    }
  }

  async getEscrowContractAddress(): Promise<string | null> {
    if (!this.escrowContract) return null;
    return await this.escrowContract.getAddress();
  }
}
