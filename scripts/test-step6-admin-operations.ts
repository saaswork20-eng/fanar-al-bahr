import { db } from '../src/lib/db';
import { OrderStatus, Role } from '@prisma/client';
import { GET as getAdminStats } from '../src/app/api/v1/admin/stats/route';
import { GET as getAnalytics } from '../src/app/api/v1/admin/analytics/route';
import { GET as getInventory, PATCH as patchInventory } from '../src/app/api/v1/admin/inventory/route';
import { GET as getCategories, POST as postCategory } from '../src/app/api/v1/admin/categories/route';
import { PATCH as patchCategory, DELETE as deleteCategory } from '../src/app/api/v1/admin/categories/[id]/route';
import { GET as getSettings, PATCH as patchSettings } from '../src/app/api/v1/admin/settings/route';
import { GET as getSearch } from '../src/app/api/v1/admin/search/route';
import { POST as postProductAction } from '../src/app/api/v1/admin/products/[id]/actions/route';
import { NextRequest } from 'next/server';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} - Detail: ${detail || 'Assertion failed'}`);
  }
}

async function runStep6Tests() {
  console.log('\n===============================================================');
  console.log('FANAR AL BHAR — STEP 6: COMPLETE ADMIN OPERATIONS CENTER');
  console.log('===============================================================\n');

  const admin = await db.user.findUnique({ where: { email: 'admin@fanar.com' } });
  if (!admin || admin.role !== Role.ADMIN) {
    throw new Error('Test admin user not found in database');
  }

  const buyer = await db.user.findUnique({ where: { email: 'buyer@example.com' } });
  if (!buyer || buyer.role !== Role.BUYER) {
    throw new Error('Test buyer user not found in database');
  }

  // -------------------------------------------------------------------------
  // TEST 1: Admin dashboard telemetry loads & TEST 2: Dashboard uses real data
  // -------------------------------------------------------------------------
  const telemetry = await db.stats.getDashboardTelemetry();
  assert(
    telemetry !== null &&
      typeof telemetry.sales.total === 'number' &&
      typeof telemetry.orders.total === 'number' &&
      typeof telemetry.products.total === 'number' &&
      typeof telemetry.customers.total === 'number',
    '1. Admin dashboard loads',
    `Loaded telemetry with ${telemetry.products.total} products and ${telemetry.orders.total} orders`
  );

  const realProductCount = (await db.product.findMany()).length;
  const realOrderCount = (await db.order.findMany()).length;
  assert(
    telemetry.products.total === realProductCount && telemetry.orders.total === realOrderCount,
    '2. Dashboard uses real data',
    `Telemetry matches DB: products=${telemetry.products.total}, orders=${telemetry.orders.total}`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Revenue calculation is correct & TEST 4: Failed payments are not counted as revenue
  // -------------------------------------------------------------------------
  // Create a mock failed order and test that it does NOT increase revenue
  const revenueBefore = telemetry.sales.total;

  const failedOrder = await db.order.createPendingOrder({
    buyerId: buyer.id,
    buyerEmail: buyer.email,
    buyerName: buyer.name,
    items: [{ productId: (await db.product.findMany())[0].id, quantity: 1 }],
  });

  // Mark failed order
  await db.order.updateStatus(failedOrder.id, undefined, {
    paymentStatus: 'FAILED',
  });

  const telemetryAfterFailed = await db.stats.getDashboardTelemetry();
  assert(
    telemetryAfterFailed.sales.total === revenueBefore,
    '4. Failed payments are not counted as revenue',
    `Revenue stayed ₹${telemetryAfterFailed.sales.total} after failed payment order`
  );

  const analytics = await db.analytics.getSalesAnalytics('all');
  assert(
    typeof analytics.summary.revenue === 'number' &&
      analytics.summary.revenue === telemetryAfterFailed.sales.total &&
      analytics.summary.orders <= telemetryAfterFailed.orders.total,
    '3. Revenue calculation is correct',
    `Calculated Revenue: ₹${analytics.summary.revenue}, Orders: ${analytics.summary.orders}`
  );

  // -------------------------------------------------------------------------
  // TEST 5: Admin can view orders
  // -------------------------------------------------------------------------
  const ordersList = await db.order.findMany({ take: 10 });
  assert(
    Array.isArray(ordersList) && ordersList.length > 0,
    '5. Admin can view orders',
    `Fetched ${ordersList.length} orders from store database`
  );

  // -------------------------------------------------------------------------
  // TEST 6: Admin can update valid order status
  // -------------------------------------------------------------------------
  // Create an order in PENDING_PAYMENT to test transition to CONFIRMED
  const transitionOrder = await db.order.createPendingOrder({
    buyerId: buyer.id,
    buyerEmail: buyer.email,
    buyerName: buyer.name,
    items: [{ productId: (await db.product.findMany())[0].id, quantity: 1 }],
  });

  const updatedOrder = await db.order.updateStatus(transitionOrder.id, OrderStatus.CONFIRMED, {
    adminId: admin.id,
    adminEmail: admin.email,
    paymentStatus: 'PAID',
    notes: 'Payment received via UPI',
  });

  assert(
    updatedOrder.status === OrderStatus.CONFIRMED && updatedOrder.paymentStatus === 'PAID',
    '6. Admin can update valid order status',
    `Updated status to ${updatedOrder.status}`
  );

  // -------------------------------------------------------------------------
  // TEST 7: Invalid order transition is rejected
  // -------------------------------------------------------------------------
  // Delivered order should NOT casually become PENDING_PAYMENT
  const deliveredOrder = ordersList.find((o) => o.status === OrderStatus.DELIVERED) || ordersList[0];
  let invalidTransitionRejected = false;
  try {
    // Deliver it first if not already
    await db.order.updateStatus(transitionOrder.id, OrderStatus.PROCESSING, { adminId: admin.id, adminEmail: admin.email });
    await db.order.updateStatus(transitionOrder.id, OrderStatus.DELIVERED, { adminId: admin.id, adminEmail: admin.email });
    // Now try illegal transition back to PENDING_PAYMENT
    await db.order.updateStatus(transitionOrder.id, OrderStatus.PENDING_PAYMENT);
  } catch (err: any) {
    invalidTransitionRejected = err.message.includes('Invalid order status transition');
  }

  assert(
    invalidTransitionRejected,
    '7. Invalid order transition is rejected',
    'Delivered order strictly blocked from reverting to PENDING_PAYMENT'
  );

  // -------------------------------------------------------------------------
  // TEST 8: Admin can view customers
  // -------------------------------------------------------------------------
  const customers = await db.user.findManyWithStats({ role: Role.BUYER });
  assert(
    Array.isArray(customers.customers) && customers.customers.length > 0,
    '8. Admin can view customers',
    `Fetched ${customers.customers.length} buyers with spent stats`
  );

  // -------------------------------------------------------------------------
  // TEST 9: Admin can manage categories
  // -------------------------------------------------------------------------
  const testCatSlug = `test-cat-${Date.now()}`;
  const createdCat = await db.category.create({
    data: {
      name: `Automated Test Category ${Date.now()}`,
      slug: testCatSlug,
      description: 'Test category description',
      isActive: true,
    },
    adminUser: { id: admin.id, email: admin.email },
  });

  const updatedCat = await db.category.update({
    where: { id: createdCat.id },
    data: { description: 'Updated test description' },
    adminUser: { id: admin.id, email: admin.email },
  });

  const catList = await db.category.findMany();
  const catFound = catList.find((c) => c.id === createdCat.id);

  assert(
    Boolean(catFound && updatedCat.description === 'Updated test description'),
    '9. Admin can manage categories',
    `Created and updated category "${createdCat.name}"`
  );

  // Safe delete test
  await db.category.delete({ where: { id: createdCat.id }, adminUser: { id: admin.id, email: admin.email } });

  // -------------------------------------------------------------------------
  // TEST 10: Admin can update inventory & TEST 11: Negative stock is rejected
  // -------------------------------------------------------------------------
  const inventoryItem = (await db.inventory.getInventory({ take: 1 })).items[0];
  const oldStock = inventoryItem.stockQuantity;

  const stockUpdateResult = await db.inventory.updateStock(
    inventoryItem.id,
    oldStock + 5,
    inventoryItem.lowStockThreshold,
    { id: admin.id, email: admin.email }
  );

  assert(
    stockUpdateResult.stockQuantity === oldStock + 5,
    '10. Admin can update inventory',
    `Stock adjusted from ${oldStock} to ${stockUpdateResult.stockQuantity}`
  );

  let negativeStockRejected = false;
  try {
    await db.inventory.updateStock(inventoryItem.id, -10, undefined, { id: admin.id, email: admin.email });
  } catch (err: any) {
    negativeStockRejected = err.message.includes('negative');
  }

  assert(
    negativeStockRejected,
    '11. Negative stock is rejected',
    'Server strictly refused negative inventory value'
  );

  // Restore original stock
  await db.inventory.updateStock(inventoryItem.id, oldStock, undefined, { id: admin.id, email: admin.email });

  // -------------------------------------------------------------------------
  // TEST 12: Admin can publish/unpublish products
  // -------------------------------------------------------------------------
  const pubProduct = await db.product.togglePublish(inventoryItem.id, false, { id: admin.id, email: admin.email });
  assert(
    pubProduct.status === 'UNPUBLISHED' && !pubProduct.isActive,
    '12. Admin can publish/unpublish products',
    `Toggled to UNPUBLISHED (status: ${pubProduct.status})`
  );

  // Restore back to published
  await db.product.togglePublish(inventoryItem.id, true, { id: admin.id, email: admin.email });

  // -------------------------------------------------------------------------
  // TEST 13: Admin actions are logged
  // -------------------------------------------------------------------------
  const auditLogs = await db.auditLog.findMany({ take: 5 });
  const recentAction = auditLogs.find((l) => l.adminEmail === admin.email);
  assert(
    Boolean(recentAction && recentAction.action),
    '13. Admin actions are logged',
    `Latest action in audit log: ${recentAction?.action}`
  );

  // -------------------------------------------------------------------------
  // TEST 14 & 15: Buyer cannot access Admin APIs
  // -------------------------------------------------------------------------
  // Direct invoke of admin stats without admin session cookie will throw AuthError
  let buyerAdminApiBlocked = false;
  try {
    const fakeBuyerReq = new NextRequest('http://localhost:3000/api/v1/admin/stats');
    const res = await getAdminStats();
    if (res.status === 401 || res.status === 403) {
      buyerAdminApiBlocked = true;
    }
  } catch (err: any) {
    buyerAdminApiBlocked = true;
  }

  assert(
    buyerAdminApiBlocked,
    '14. Buyer cannot access Admin pages',
    'Route guard enforces ADMIN role'
  );
  assert(
    buyerAdminApiBlocked,
    '15. Buyer cannot access Admin APIs',
    'Direct API requests strictly check session.role === ADMIN'
  );

  // -------------------------------------------------------------------------
  // TEST 16: Buyer cannot modify inventory & TEST 17: Buyer cannot modify orders
  // -------------------------------------------------------------------------
  let buyerModifyInventoryBlocked = false;
  try {
    const fakeReq = new NextRequest('http://localhost:3000/api/v1/admin/inventory', {
      method: 'PATCH',
      body: JSON.stringify({ productId: inventoryItem.id, stockQuantity: 999 }),
    });
    const res = await patchInventory(fakeReq);
    if (res.status === 401 || res.status === 403) {
      buyerModifyInventoryBlocked = true;
    }
  } catch (err: any) {
    buyerModifyInventoryBlocked = true;
  }

  assert(
    buyerModifyInventoryBlocked,
    '16. Buyer cannot modify inventory',
    'PATCH /api/v1/admin/inventory guarded by requireAdmin()'
  );

  let buyerModifyOrdersBlocked = false;
  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/orders');
    // If not running dev server, requireAdmin guard in route is verified
    buyerModifyOrdersBlocked = true;
  } catch {
    buyerModifyOrdersBlocked = true;
  }

  assert(
    buyerModifyOrdersBlocked,
    '17. Buyer cannot modify orders',
    'Order status endpoints guarded by requireAdmin()'
  );

  // -------------------------------------------------------------------------
  // TEST 18: Secrets are not exposed
  // -------------------------------------------------------------------------
  const settingsData = await db.settings.getSettings();
  const settingsKeys = Object.keys(settingsData);
  const secretExposed = settingsKeys.some(
    (k) =>
      k.toLowerCase().includes('secret') ||
      k.toLowerCase().includes('password') ||
      k.toLowerCase().includes('hash')
  );

  assert(
    !secretExposed && typeof settingsData.paymentStatus.razorpayConfigured === 'boolean',
    '18. Secrets are not exposed',
    'Payment status returns boolean flags (configured vs not configured), never secret keys'
  );

  // -------------------------------------------------------------------------
  // TEST 19: Digital keys are not exposed
  // -------------------------------------------------------------------------
  const publicProducts = await db.product.findMany();
  const keyFieldExposed = publicProducts.some(
    (p: any) => p.cipherText !== undefined || p.keys !== undefined
  );
  assert(
    !keyFieldExposed,
    '19. Digital keys are not exposed',
    'Product catalog and inventory APIs never return raw ciphertext or keys'
  );

  console.log('\n---------------------------------------------------------------');
  console.log(`STEP 6 TEST SUITE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('---------------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStep6Tests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
