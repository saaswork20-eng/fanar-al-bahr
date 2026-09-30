import { db } from '../src/lib/db';
import { Role } from '@prisma/client';
import { encryptDigitalKey, decryptDigitalKey } from '../src/lib/crypto-vault';

async function runTests() {
  console.log('================================================================');
  console.log('  FANAR AL BHAR — SINGLE-VENDOR VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Role Enumeration Integrity
  console.log('--- TEST GROUP 1: Role System & User Integrity ---');
  const roles = Object.values(Role);
  assert(
    roles.length === 2 && roles.includes('ADMIN' as Role) && roles.includes('BUYER' as Role),
    'Role enum contains strictly ADMIN and BUYER',
    `Found roles: ${roles.join(', ')}`
  );
  assert(
    !roles.includes('SELLER' as any),
    'SELLER role is completely eradicated from Prisma Role enum'
  );

  const admin = await db.user.findUnique({ where: { email: 'admin@fanar.com' } });
  assert(!!admin && admin.role === 'ADMIN', 'Admin account exists with ADMIN role');

  const buyer = await db.user.findUnique({ where: { email: 'buyer@example.com' } });
  assert(!!buyer && buyer.role === 'BUYER', 'Buyer account exists with BUYER role');

  // TEST 2: Product Single-Vendor Catalog Architecture
  console.log('\n--- TEST GROUP 2: Single-Vendor Product Architecture ---');
  const products = await db.product.findMany({ where: { isActive: true } });
  assert(products.length >= 14, `Active products catalog loaded (Count: ${products.length})`);

  const sampleProduct = products[0];
  assert(
    typeof sampleProduct.price === 'number' && sampleProduct.price > 0,
    'Product possesses direct price field (No seller offer required)',
    `Price: ₹${sampleProduct.price}`
  );
  assert(
    typeof sampleProduct.stockQuantity === 'number',
    'Product possesses direct stockQuantity inventory',
    `Stock: ${sampleProduct.stockQuantity}`
  );
  assert(
    !!sampleProduct.sku && sampleProduct.sku.startsWith('FAB-'),
    'Product possesses valid Fanar Al Bhar SKU',
    `SKU: ${sampleProduct.sku}`
  );
  assert(
    !(sampleProduct as any).sellerId && !(sampleProduct as any).sellerProfileId,
    'Product contains zero seller identifiers (Pure single-vendor ownership)'
  );

  // TEST 3: Admin Direct Product Creation & Deletion (Single Vendor)
  console.log('\n--- TEST GROUP 3: Admin Direct Product Lifecycle ---');
  const uniqueSuffix = Date.now().toString();
  const newProduct = await db.product.create({
    data: {
      title: 'Fanar Exclusive Test Key 2026',
      slug: `fanar-exclusive-test-key-${uniqueSuffix}`,
      description: 'Single-vendor automated verification test title',
      price: 2499,
      discountPrice: 1999,
      stockQuantity: 10,
      sku: `FAB-TEST-${uniqueSuffix.slice(-5)}`,
      deliveryType: 'INSTANT_KEY',
      isActive: true,
      isFeatured: false,
    },
  });
  assert(!!newProduct.id, 'Admin successfully created single-vendor product', `ID: ${newProduct.id}`);

  // Test Direct Inventory Update
  const updatedStock = await db.product.updateStock(newProduct.id, 25);
  assert(updatedStock.stockQuantity === 25, 'Inventory successfully updated by Admin to 25 units');

  // Test Direct Price Update
  const updatedProduct = await db.product.update({
    where: { id: newProduct.id },
    data: { price: 2299, discountPrice: 1799 },
  });
  assert(updatedProduct.price === 2299, 'Direct price update verified');

  // TEST 4: Digital Key Vault Linked Directly to Product
  console.log('\n--- TEST GROUP 4: Digital Key Vault Ingestion & AES-256 Encryption ---');
  const rawSecretKey = 'FAB-TEST-KEY-XXXX-YYYY-ZZZZ';
  const encryptedPayload = encryptDigitalKey(rawSecretKey);

  const digitalKey = await db.productKey.create({
    data: {
      productId: newProduct.id,
      maskedKey: 'FAB-TEST-KEY-****-****-ZZZZ',
      cipherText: encryptedPayload.cipherText,
      iv: encryptedPayload.iv,
      tag: encryptedPayload.tag,
      status: 'AVAILABLE',
    },
  });
  assert(
    digitalKey.productId === newProduct.id,
    'Digital key linked directly to Product (Not seller offer)',
    `Key ID: ${digitalKey.id}`
  );

  const decryptedKey = decryptDigitalKey(
    digitalKey.cipherText,
    digitalKey.iv,
    digitalKey.tag
  );
  assert(
    decryptedKey === rawSecretKey,
    'Hardware-grade AES-256-GCM decryption verified for single-vendor delivery'
  );

  // Clean up test product
  await db.product.delete({ where: { id: newProduct.id } });
  const checkDeleted = await db.product.findUnique({ where: { id: newProduct.id } });
  assert(!checkDeleted, 'Test product safely cleaned up');

  // TEST 5: Telemetry & Inventory Aggregations
  console.log('\n--- TEST GROUP 5: Single-Vendor Telemetry ---');
  const lowStockCount = await db.product.countLowStock(5);
  const outOfStockCount = await db.product.countOutOfStock();
  assert(typeof lowStockCount === 'number', `Low stock detection functional (${lowStockCount} items)`);
  assert(typeof outOfStockCount === 'number', `Out of stock detection functional (${outOfStockCount} items)`);

  const orderStats = await db.order.aggregateSales();
  assert(orderStats.totalOrders >= 3, `Order count aggregate verified (${orderStats.totalOrders} orders)`);
  assert(orderStats.totalRevenue > 0, `Store gross revenue verified (₹${orderStats.totalRevenue})`);

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
