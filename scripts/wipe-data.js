/* eslint-disable */
// Vacía todos los datos transaccionales/productos, conservando usuarios y auth.
// Uso: node scripts/wipe-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function counts(label) {
  const [users, garments, transactions, favorites, verifications, ratings, disputes, messages] =
    await Promise.all([
      prisma.user.count(),
      prisma.garment.count(),
      prisma.transaction.count(),
      prisma.favorite.count(),
      prisma.verification.count(),
      prisma.rating.count(),
      prisma.dispute.count(),
      prisma.message.count(),
    ]);
  console.log(`\n=== ${label} ===`);
  console.table({ users, garments, transactions, favorites, verifications, ratings, disputes, messages });
}

async function main() {
  await counts('ANTES');

  // Orden respetando llaves foráneas (hijos -> padres).
  await prisma.message.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.garment.deleteMany();

  await counts('DESPUÉS');
  console.log('\n✅ Datos borrados. Usuarios y billeteras intactos.');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
