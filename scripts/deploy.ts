import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = ethers.formatEther(await ethers.provider.getBalance(deployer.address));
  console.log('Deployer:', deployer.address);
  console.log('Balance: ', balance, 'POL\n');

  if (parseFloat(balance) < 0.05) {
    console.warn('⚠️  Balance bajo. Necesitás al menos ~0.05 POL para desplegar.');
  }

  // ── GarmentNFT ──────────────────────────────────────────────
  console.log('Desplegando GarmentNFT...');
  const GarmentNFT = await ethers.getContractFactory('GarmentNFT');
  const nft = await GarmentNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log('✅ GarmentNFT:', nftAddress);

  // ── ReWearEscrow ─────────────────────────────────────────────
  console.log('\nDesplegando ReWearEscrow...');
  const Escrow = await ethers.getContractFactory('ReWearEscrow');
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log('✅ ReWearEscrow:', escrowAddress);

  console.log('\n─────────────────────────────────────────────');
  console.log('Agregar a rewear-api/.env:');
  console.log(`PLATFORM_WALLET_PRIVATE_KEY="<tu-clave-privada>"`);
  console.log(`PLATFORM_WALLET_ADDRESS="${deployer.address}"`);
  console.log(`NFT_CONTRACT_ADDRESS="${nftAddress}"`);
  console.log(`ESCROW_CONTRACT_ADDRESS="${escrowAddress}"`);
  console.log('\nAgregar a rewear-app/.env.local:');
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="${escrowAddress}"`);
  console.log('─────────────────────────────────────────────');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
