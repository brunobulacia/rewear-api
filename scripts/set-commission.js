/* eslint-disable */
// Setea la comisión del escrow vivo a 3% (300 bps). Standalone con ethers
// (Hardhat 3 no corre en este repo CommonJS). Solo el owner (platform wallet)
// puede ejecutarlo. Uso: node scripts/set-commission.js
require('dotenv').config();
const { ethers } = require('ethers');
const EscrowAbi = require('../src/blockchain/abi/Escrow.json');

const TARGET_BPS = 300;

async function main() {
  const rpc = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com';
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  const address = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!pk || !address) throw new Error('Faltan PLATFORM_WALLET_PRIVATE_KEY o ESCROW_CONTRACT_ADDRESS en .env');

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const escrow = new ethers.Contract(address, EscrowAbi, wallet);

  const [current, owner] = await Promise.all([escrow.commissionBps(), escrow.owner()]);
  console.log('Contrato:        ', address);
  console.log('Comisión actual: ', current.toString(), 'bps');
  console.log('Owner:           ', owner);
  console.log('Wallet:          ', wallet.address);

  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error('La wallet no es owner del contrato — no puede cambiar la comisión.');
  }
  if (Number(current) === TARGET_BPS) {
    console.log(`Ya está en ${TARGET_BPS} bps. Nada que hacer.`);
    return;
  }

  console.log(`\nEnviando setCommissionBps(${TARGET_BPS})...`);
  const tx = await escrow.setCommissionBps(TARGET_BPS);
  console.log('tx hash:', tx.hash);
  await tx.wait();
  const updated = await escrow.commissionBps();
  console.log('✅ Comisión actualizada a', updated.toString(), 'bps');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
