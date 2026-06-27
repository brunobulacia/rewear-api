/* eslint-disable */
// Compila ReWearEscrow (resolviendo imports de OpenZeppelin) y lo deploya a
// Sepolia con ethers. Evita Hardhat 3 (que no corre en este repo CommonJS).
// initialOwner = platform wallet → feeRecipient arranca = platform wallet.
// Uso: node scripts/deploy-escrow.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');

const root = path.join(__dirname, '..');

// Callback de imports: solc resuelve los relativos contra la key del importador,
// así que acá ya llegan como '@openzeppelin/contracts/...'. Los leemos de node_modules.
function findImport(importPath) {
  try {
    return { contents: fs.readFileSync(path.join(root, 'node_modules', importPath), 'utf8') };
  } catch (e) {
    return { error: `No encontrado: ${importPath}` };
  }
}

async function main() {
  const source = fs.readFileSync(path.join(root, 'contracts', 'Escrow.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources: { 'Escrow.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  console.log('Compilando Escrow.sol con solc', solc.version());
  const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
  const errs = (out.errors || []).filter((e) => e.severity === 'error');
  if (errs.length) {
    errs.forEach((e) => console.error(e.formattedMessage));
    throw new Error('Errores de compilación');
  }
  const c = out.contracts['Escrow.sol']['ReWearEscrow'];
  const abi = c.abi;
  const bytecode = '0x' + c.evm.bytecode.object;

  const rpc = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com';
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error('Falta PLATFORM_WALLET_PRIVATE_KEY en .env');

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer:', wallet.address, '—', ethers.formatEther(balance), 'ETH');

  console.log('Desplegando ReWearEscrow (initialOwner = deployer)...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const block = (await contract.deploymentTransaction().wait()).blockNumber;
  const feeRecipient = await contract.feeRecipient();

  // Persistir la ABI fresca para backend y frontend (mantiene todo en sync).
  fs.writeFileSync(
    path.join(root, 'src', 'blockchain', 'abi', 'Escrow.json'),
    JSON.stringify(abi, null, 2) + '\n',
  );
  const frontAbi = path.join(root, '..', 'rewear-app', 'src', 'lib', 'escrow-abi.json');
  if (fs.existsSync(frontAbi)) fs.writeFileSync(frontAbi, JSON.stringify(abi, null, 2) + '\n');

  console.log('\n─────────────────────────────────────────────');
  console.log('✅ ReWearEscrow:', address, `(bloque ${block})`);
  console.log('   feeRecipient:', feeRecipient);
  console.log('   ABI actualizada en backend y frontend.');
  console.log('\nActualizar rewear-api/.env:');
  console.log(`ESCROW_CONTRACT_ADDRESS="${address}"`);
  console.log('Actualizar rewear-app/.env.local:');
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="${address}"`);
  console.log('─────────────────────────────────────────────');
}

main().catch((e) => { console.error('❌', e.message || e); process.exit(1); });
