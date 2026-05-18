import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as GarmentNFTAbi from './abi/GarmentNFT.json';
import * as EscrowAbi from './abi/Escrow.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private nftContract: ethers.Contract | null = null;
  private escrowContract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const privateKey       = this.config.get<string>('PLATFORM_WALLET_PRIVATE_KEY');
    const nftAddress       = this.config.get<string>('NFT_CONTRACT_ADDRESS');
    const escrowAddress    = this.config.get<string>('ESCROW_CONTRACT_ADDRESS');
    const rpcUrl           = this.config.get<string>('SEPOLIA_RPC')
                           || 'https://rpc.sepolia.org';

    if (!privateKey) {
      this.logger.warn('PLATFORM_WALLET_PRIVATE_KEY no configurado. Blockchain deshabilitado.');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet  = new ethers.Wallet(privateKey, this.provider);

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
      this.logger.error('Error inicializando blockchain service', err);
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
