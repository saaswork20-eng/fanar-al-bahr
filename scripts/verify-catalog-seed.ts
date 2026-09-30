import { db } from '../src/lib/db';

async function main() {
  const pCount = await db.product.count();
  const oCount = await db.productOffer.count();
  const products = await db.product.findMany({ take: 3 });
  const offers = await db.productOffer.findMany({ take: 3, include: { product: true, seller: true } });

  console.log('--- SEED VERIFICATION ---');
  console.log('Total Products:', pCount);
  console.log('Total Offers:', oCount);
  console.log('Sample Product:', products[0]?.title);
  console.log('Sample Offer:', offers[0]?.product?.title, 'by', offers[0]?.seller?.storeName, 'at ₹', offers[0]?.unitPrice);
}

main().catch(console.error);
