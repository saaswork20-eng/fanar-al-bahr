import { db } from '../src/lib/db';

async function main() {
  const pCount = await db.product.count();
  const uCount = await db.user.count();
  const oCount = await db.order.count();
  const sales = await db.order.aggregateSales();
  const lowStock = await db.product.countLowStock();
  const outOfStock = await db.product.countOutOfStock();

  console.log('--- SINGLE-VENDOR DATABASE INITIALIZED ---');
  console.log('Products:', pCount);
  console.log('Users (Admin + Customers):', uCount);
  console.log('Orders:', oCount);
  console.log('Total Revenue:', sales.totalRevenue);
  console.log('Low Stock Items:', lowStock);
  console.log('Out of Stock Items:', outOfStock);
}

main().catch(console.error);
