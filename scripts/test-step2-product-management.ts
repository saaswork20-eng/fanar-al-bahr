import { db } from '../src/lib/db';
import { POST as createProductHandler, GET as getAdminProductsHandler } from '../src/app/api/v1/admin/products/route';
import { GET as getProductHandler, PATCH as updateProductHandler, DELETE as deleteProductHandler } from '../src/app/api/v1/admin/products/[id]/route';
import { PATCH as updateStockHandler } from '../src/app/api/v1/admin/products/[id]/stock/route';
import { GET as getStorefrontProductsHandler } from '../src/app/api/v1/products/route';
import { NextRequest } from 'next/server';
import { signSessionToken, setTestSessionContext, SessionPayload } from '../src/lib/session';

async function runStep2Tests() {
  console.log('================================================================');
  console.log('  FANAR AL BHAR — STEP 2 PRODUCT MANAGEMENT TEST SUITE');
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

  // 1. Prepare Admin & Buyer Sessions
  const adminUser = await db.user.findUnique({ where: { email: 'admin@fanar.com' } });
  if (!adminUser) throw new Error('Admin user not found in DB');
  const buyerUser = await db.user.findUnique({ where: { email: 'buyer@example.com' } });
  if (!buyerUser) throw new Error('Buyer user not found in DB');

  const adminSession: SessionPayload = {
    userId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const buyerSession: SessionPayload = {
    userId: buyerUser.id,
    email: buyerUser.email,
    name: buyerUser.name,
    role: 'BUYER',
    status: 'ACTIVE',
  };

  function makeReq(url: string, method: string, body?: any): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const category = (await db.category.findMany())[0];
  const testSku = `FAB-TEST-${Date.now()}`;
  const testSlug = `fab-automated-test-${Date.now()}`;
  let createdProductId = '';

  // TEST 1: Admin Creates Product
  console.log('--- TEST 1: Admin Creates Product ---');
  setTestSessionContext(adminSession);
  const createReq = makeReq('http://localhost:3000/api/v1/admin/products', 'POST', {
    title: 'EA FC 26 Championship Edition',
    slug: testSlug,
    sku: testSku,
    description: 'Automated test product for single-vendor catalog management.',
    price: 4999,
    discountPrice: 3999,
    stockQuantity: 25,
    lowStockThreshold: 5,
    categoryId: category.id,
    status: 'PUBLISHED',
    brand: 'EA Sports',
    isFeatured: true,
  });

  const createRes = await createProductHandler(createReq);
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success, '1. Admin creates product', createData.error);
  if (createData.product) {
    createdProductId = createData.product.id;
  }

  // TEST 2: Admin Reads Product
  console.log('\n--- TEST 2: Admin Reads Product ---');
  setTestSessionContext(adminSession);
  const readReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'GET');
  const readRes = await getProductHandler(readReq, { params: { id: createdProductId } });
  const readData = await readRes.json();
  assert(
    readRes.status === 200 && readData.product?.id === createdProductId,
    '2. Admin reads product details from database'
  );

  // TEST 3: Admin Updates Product
  console.log('\n--- TEST 3: Admin Updates Product ---');
  setTestSessionContext(adminSession);
  const updateReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
    title: 'EA FC 26 Championship Edition (Updated)',
    price: 4799,
    discountPrice: 3699,
  });
  const updateRes = await updateProductHandler(updateReq, { params: { id: createdProductId } });
  const updateData = await updateRes.json();
  assert(
    updateRes.status === 200 && updateData.product?.price === 4799,
    '3. Admin updates product pricing and metadata'
  );

  // TEST 4: Admin Publishes Product
  console.log('\n--- TEST 4: Admin Publishes Product ---');
  setTestSessionContext(adminSession);
  const pubReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
    status: 'PUBLISHED',
  });
  const pubRes = await updateProductHandler(pubReq, { params: { id: createdProductId } });
  const pubData = await pubRes.json();
  assert(
    pubRes.status === 200 && pubData.product?.status === 'PUBLISHED' && pubData.product?.isActive === true,
    '4. Admin publishes product (status: PUBLISHED, isActive: true)'
  );

  // TEST 5: Admin Unpublishes Product
  console.log('\n--- TEST 5: Admin Unpublishes Product ---');
  setTestSessionContext(adminSession);
  const unpubReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
    status: 'UNPUBLISHED',
  });
  const unpubRes = await updateProductHandler(unpubReq, { params: { id: createdProductId } });
  const unpubData = await unpubRes.json();
  assert(
    unpubRes.status === 200 && unpubData.product?.status === 'UNPUBLISHED' && unpubData.product?.isActive === false,
    '5. Admin unpublishes product (status: UNPUBLISHED, isActive: false)'
  );

  // TEST 6: Admin Updates Stock
  console.log('\n--- TEST 6: Admin Updates Stock ---');
  setTestSessionContext(adminSession);
  const stockReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}/stock`, 'PATCH', {
    stockQuantity: 42,
    lowStockThreshold: 8,
  });
  const stockRes = await updateStockHandler(stockReq, { params: { id: createdProductId } });
  const stockData = await stockRes.json();
  assert(
    stockRes.status === 200 && stockData.product?.stockQuantity === 42,
    '6. Admin updates stock via dedicated stock endpoint (stockQuantity: 42)'
  );

  // TEST 7: Duplicate SKU Rejected
  console.log('\n--- TEST 7: Duplicate SKU Validation ---');
  setTestSessionContext(adminSession);
  const dupSkuReq = makeReq('http://localhost:3000/api/v1/admin/products', 'POST', {
    title: 'Duplicate SKU Test Game',
    slug: `dup-sku-${Date.now()}`,
    sku: testSku, // duplicate
    price: 999,
    categoryId: category.id,
  });
  const dupSkuRes = await createProductHandler(dupSkuReq);
  assert(
    dupSkuRes.status === 409,
    '7. Duplicate SKU rejected with HTTP 409 Conflict'
  );

  // TEST 8: Duplicate Slug Rejected
  console.log('\n--- TEST 8: Duplicate Slug Validation ---');
  setTestSessionContext(adminSession);
  const dupSlugReq = makeReq('http://localhost:3000/api/v1/admin/products', 'POST', {
    title: 'Duplicate Slug Test Game',
    slug: testSlug, // duplicate
    sku: `NEW-SKU-${Date.now()}`,
    price: 999,
    categoryId: category.id,
  });
  const dupSlugRes = await createProductHandler(dupSlugReq);
  assert(
    dupSlugRes.status === 409,
    '8. Duplicate slug rejected with HTTP 409 Conflict'
  );

  // TEST 9: Invalid Price Rejected
  console.log('\n--- TEST 9: Invalid Price Validation ---');
  setTestSessionContext(adminSession);
  const negPriceReq = makeReq('http://localhost:3000/api/v1/admin/products', 'POST', {
    title: 'Negative Price Game',
    slug: `neg-price-${Date.now()}`,
    price: -150,
    categoryId: category.id,
  });
  const negPriceRes = await createProductHandler(negPriceReq);
  assert(
    negPriceRes.status === 400,
    '9. Negative price rejected with HTTP 400 Bad Request'
  );

  // TEST 10: Negative Stock Rejected
  console.log('\n--- TEST 10: Negative Stock Validation ---');
  setTestSessionContext(adminSession);
  const negStockReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}/stock`, 'PATCH', {
    stockQuantity: -5,
  });
  const negStockRes = await updateStockHandler(negStockReq, { params: { id: createdProductId } });
  assert(
    negStockRes.status === 400,
    '10. Negative stock rejected with HTTP 400 Bad Request'
  );

  // TEST 11: Buyer Cannot Create Product
  console.log('\n--- TEST 11: Buyer Cannot Create Product ---');
  setTestSessionContext(buyerSession);
  const buyerCreateReq = makeReq('http://localhost:3000/api/v1/admin/products', 'POST', {
    title: 'Hacked Product By Buyer',
    slug: 'hacked-product',
    price: 1,
    categoryId: category.id,
  });
  const buyerCreateRes = await createProductHandler(buyerCreateReq);
  assert(
    buyerCreateRes.status === 403,
    '11. Buyer role rejected from creating product with HTTP 403 Forbidden'
  );

  // TEST 12: Buyer Cannot Edit Product
  console.log('\n--- TEST 12: Buyer Cannot Edit Product ---');
  setTestSessionContext(buyerSession);
  const buyerEditReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
    price: 10,
  });
  const buyerEditRes = await updateProductHandler(buyerEditReq, { params: { id: createdProductId } });
  assert(
    buyerEditRes.status === 403,
    '12. Buyer role rejected from editing product with HTTP 403 Forbidden'
  );

  // TEST 13: Buyer Cannot Change Stock
  console.log('\n--- TEST 13: Buyer Cannot Change Stock ---');
  setTestSessionContext(buyerSession);
  const buyerStockReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}/stock`, 'PATCH', {
    stockQuantity: 9999,
  });
  const buyerStockRes = await updateStockHandler(buyerStockReq, { params: { id: createdProductId } });
  assert(
    buyerStockRes.status === 403,
    '13. Buyer role rejected from changing stock with HTTP 403 Forbidden'
  );

  // TEST 14: Unpublished Product Not Visible In Storefront
  console.log('\n--- TEST 14: Unpublished Product Storefront Isolation ---');
  setTestSessionContext(adminSession);
  await updateProductHandler(
    makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
      status: 'UNPUBLISHED',
    }),
    { params: { id: createdProductId } }
  );

  setTestSessionContext(null); // Anonymous buyer
  const sfReq1 = makeReq('http://localhost:3000/api/v1/products', 'GET');
  const sfRes1 = await getStorefrontProductsHandler(sfReq1);
  const sfData1 = await sfRes1.json();
  const foundWhenUnpublished = sfData1.products.find((p: any) => p.id === createdProductId);
  assert(
    !foundWhenUnpublished,
    '14. Unpublished product is completely hidden from public buyer storefront'
  );

  // TEST 15: Published Product Appears in Storefront
  console.log('\n--- TEST 15: Published Product Storefront Visibility ---');
  setTestSessionContext(adminSession);
  await updateProductHandler(
    makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}`, 'PATCH', {
      status: 'PUBLISHED',
      isActive: true,
    }),
    { params: { id: createdProductId } }
  );

  setTestSessionContext(null); // Anonymous buyer
  const sfReq2 = makeReq('http://localhost:3000/api/v1/products', 'GET');
  const sfRes2 = await getStorefrontProductsHandler(sfReq2);
  const sfData2 = await sfRes2.json();
  const foundWhenPublished = sfData2.products.find((p: any) => p.id === createdProductId);
  assert(
    !!foundWhenPublished && foundWhenPublished.id === createdProductId,
    '15. Published product appears immediately in public buyer storefront catalog'
  );

  // Clean up test product
  setTestSessionContext(adminSession);
  const delReq = makeReq(`http://localhost:3000/api/v1/admin/products/${createdProductId}?permanent=true`, 'DELETE');
  await deleteProductHandler(delReq, { params: { id: createdProductId } });

  console.log('\n================================================================');
  console.log(`  STEP 2 VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep2Tests().catch((e) => {
  console.error('Fatal step 2 test error:', e);
  process.exit(1);
});
