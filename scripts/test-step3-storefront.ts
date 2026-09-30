import { db } from '../src/lib/db';
import { GET as getProducts } from '../src/app/api/v1/products/route';
import { GET as getProductBySlug } from '../src/app/api/v1/products/[slug]/route';
import { GET as getCategories } from '../src/app/api/v1/categories/route';
import { POST as createAdminProduct } from '../src/app/api/v1/admin/products/route';
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { setTestSessionContext } from '../src/lib/session';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runStep3Tests() {
  console.log('\n================================================================');
  console.log('  FANAR AL BHAR — STEP 3 STOREFRONT & DISCOVERY VERIFICATION');
  console.log('================================================================\n');

  let testDraftProduct: any = null;
  let testUnpublishedProduct: any = null;
  let testPublishedProduct: any = null;
  let testOutOfStockProduct: any = null;

  try {
    // Setup test products using db directly
    testDraftProduct = await db.product.create({
      data: {
        title: 'Draft Discovery Secret Game',
        slug: 'draft-discovery-secret-game',
        description: 'Should not appear in buyer storefront',
        coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        bannerImageUrl: null,
        categoryId: 'cat_games',
        price: 2999,
        discountPrice: 1999,
        stockQuantity: 10,
        sku: 'TEST-DRAFT-01',
        deliveryType: 'INSTANT_KEY',
        status: 'DRAFT',
        isActive: true,
      },
    });

    testUnpublishedProduct = await db.product.create({
      data: {
        title: 'Unpublished Archive Game',
        slug: 'unpublished-archive-game',
        description: 'Should not appear in buyer storefront',
        coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        bannerImageUrl: null,
        categoryId: 'cat_games',
        price: 1999,
        stockQuantity: 10,
        sku: 'TEST-UNPUB-01',
        deliveryType: 'INSTANT_KEY',
        status: 'UNPUBLISHED',
        isActive: false,
      },
    });

    testPublishedProduct = await db.product.create({
      data: {
        title: 'The Witcher 4: Next-Gen Edition Global',
        slug: 'the-witcher-4-next-gen-edition-global-pc',
        description: 'Epic open world RPG direct key from Fanar Al Bhar',
        shortDescription: 'Next-gen open world fantasy saga',
        coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
        bannerImageUrl: null,
        categoryId: 'cat_games',
        platformId: 'plat_pc',
        brand: 'CD PROJEKT RED',
        price: 4999,
        discountPrice: 3499,
        stockQuantity: 30,
        lowStockThreshold: 5,
        sku: 'TEST-WITCHER-4',
        deliveryType: 'INSTANT_KEY',
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: true,
      },
    });

    testOutOfStockProduct = await db.product.create({
      data: {
        title: 'Limited Collector Vinyl Code Out Of Stock',
        slug: 'limited-collector-vinyl-code-soldout',
        description: 'Zero units remaining in stock',
        coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        bannerImageUrl: null,
        categoryId: 'cat_subscriptions',
        price: 999,
        stockQuantity: 0,
        sku: 'TEST-OOS-01',
        deliveryType: 'INSTANT_KEY',
        status: 'PUBLISHED',
        isActive: true,
      },
    });

    // 1. Published product appears publicly
    console.log('--- TEST 1: Published Product Visibility ---');
    const pubReq = new NextRequest('http://localhost:3000/api/v1/products');
    const pubRes = await getProducts(pubReq);
    const pubData = await pubRes.json();
    const hasPublished = pubData.products.some((p: any) => p.slug === testPublishedProduct.slug);
    assert(hasPublished, '1. Published product appears publicly in buyer catalog');

    // 2. Draft product does not appear
    console.log('\n--- TEST 2: Draft Product Isolation ---');
    const hasDraft = pubData.products.some((p: any) => p.slug === testDraftProduct.slug);
    assert(!hasDraft, '2. Draft product does not appear in public catalog');

    // 3. Unpublished product does not appear
    console.log('\n--- TEST 3: Unpublished Product Isolation ---');
    const hasUnpublished = pubData.products.some((p: any) => p.slug === testUnpublishedProduct.slug);
    assert(!hasUnpublished, '3. Unpublished product does not appear in public catalog');

    // 4. Out-of-stock behavior works
    console.log('\n--- TEST 4: Out-of-Stock Behavior ---');
    const oosInCatalog = pubData.products.find((p: any) => p.slug === testOutOfStockProduct.slug);
    assert(
      oosInCatalog && oosInCatalog.stockStatus === 'OUT_OF_STOCK' && oosInCatalog.inStock === false,
      '4. Out-of-stock product correctly displays OUT_OF_STOCK state and inStock=false'
    );

    // 5. Product slug works
    console.log('\n--- TEST 5: Product Slug Query ---');
    const slugReq = new NextRequest(`http://localhost:3000/api/v1/products/${testPublishedProduct.slug}`);
    const slugRes = await getProductBySlug(slugReq, { params: { slug: testPublishedProduct.slug } });
    const slugData = await slugRes.json();
    assert(
      slugRes.status === 200 && slugData.success && slugData.product.slug === testPublishedProduct.slug,
      '5. Product slug endpoint returns full public product details'
    );

    // 6. Invalid slug returns proper 404
    console.log('\n--- TEST 6: Invalid Slug Returns 404 ---');
    const invalidSlugReq = new NextRequest('http://localhost:3000/api/v1/products/non-existent-product-slug-xyz');
    const invalidSlugRes = await getProductBySlug(invalidSlugReq, { params: { slug: 'non-existent-product-slug-xyz' } });
    assert(
      invalidSlugRes.status === 404,
      '6. Invalid product slug returns proper HTTP 404'
    );

    // Draft slug also returns 404 to public buyer
    const draftSlugReq = new NextRequest(`http://localhost:3000/api/v1/products/${testDraftProduct.slug}`);
    const draftSlugRes = await getProductBySlug(draftSlugReq, { params: { slug: testDraftProduct.slug } });
    assert(
      draftSlugRes.status === 404,
      '6b. Draft product slug returns HTTP 404 to public buyer'
    );

    // 7. Search works
    console.log('\n--- TEST 7: Search Filtering ---');
    const searchReq = new NextRequest('http://localhost:3000/api/v1/products?q=Witcher');
    const searchRes = await getProducts(searchReq);
    const searchData = await searchRes.json();
    assert(
      searchData.products.some((p: any) => p.slug === testPublishedProduct.slug) &&
      !searchData.products.some((p: any) => p.slug === 'prod_001'),
      '7. Search query "Witcher" accurately filters matching published products'
    );

    // 8. Category filtering works
    console.log('\n--- TEST 8: Category Filtering ---');
    const catReq = new NextRequest('http://localhost:3000/api/v1/products?category=software-os');
    const catRes = await getProducts(catReq);
    const catData = await catRes.json();
    const allSoftware = catData.products.every((p: any) => p.categoryId === 'cat_software');
    assert(
      allSoftware && catData.products.length > 0,
      '8. Category filter "software-os" returns only Software & OS products'
    );

    // 9. Price filtering works
    console.log('\n--- TEST 9: Price Range Filtering ---');
    const priceReq = new NextRequest('http://localhost:3000/api/v1/products?minPrice=1000&maxPrice=3000');
    const priceRes = await getProducts(priceReq);
    const priceData = await priceRes.json();
    const inRange = priceData.products.every(
      (p: any) => p.currentPrice >= 1000 && p.currentPrice <= 3000
    );
    assert(
      inRange && priceData.products.length > 0,
      '9. Price filter minPrice=1000 & maxPrice=3000 accurately restricts catalog items'
    );

    // 10. Sorting works
    console.log('\n--- TEST 10: Sorting ---');
    const sortAscReq = new NextRequest('http://localhost:3000/api/v1/products?sort=price-asc');
    const sortAscRes = await getProducts(sortAscReq);
    const sortAscData = await sortAscRes.json();
    let isAsc = true;
    for (let i = 0; i < sortAscData.products.length - 1; i++) {
      if (sortAscData.products[i].currentPrice > sortAscData.products[i + 1].currentPrice) {
        isAsc = false;
        break;
      }
    }
    assert(isAsc && sortAscData.products.length > 1, '10. Sorting by price-asc correctly orders products from lowest to highest');

    // 11. Pagination works
    console.log('\n--- TEST 11: Pagination ---');
    const pageReq = new NextRequest('http://localhost:3000/api/v1/products?page=1&limit=4');
    const pageRes = await getProducts(pageReq);
    const pageData = await pageRes.json();
    assert(
      pageData.products.length === 4 &&
      pageData.pagination.page === 1 &&
      pageData.pagination.limit === 4 &&
      pageData.pagination.totalPages >= 2,
      '11. Pagination correctly restricts items per page and computes totalPages'
    );

    // 12. Product details load correctly
    console.log('\n--- TEST 12: Product Details Completeness ---');
    assert(
      slugData.product.title === testPublishedProduct.title &&
      slugData.product.regularPrice === 4999 &&
      slugData.product.salePrice === 3499 &&
      slugData.product.discountPercent === 30 &&
      slugData.product.isOnSale === true &&
      slugData.product.sku === 'TEST-WITCHER-4' &&
      Array.isArray(slugData.relatedProducts),
      '12. Product details include regular price, sale price, discount %, SKU, and related products'
    );

    // 13. Buyer cannot access Admin functionality
    console.log('\n--- TEST 13: Buyer Admin Restriction ---');
    setTestSessionContext({
      user: {
        id: 'usr_buyer_001',
        email: 'buyer@example.com',
        role: Role.BUYER,
        name: 'Alex Buyer',
      },
    });
    const buyerCreateReq = new NextRequest('http://localhost:3000/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Hacked Product by Buyer',
        categoryId: 'cat_games',
        price: 10,
        stockQuantity: 100,
      }),
    });
    const buyerCreateRes = await createAdminProduct(buyerCreateReq);
    assert(
      buyerCreateRes.status === 403,
      '13. Buyer role is strictly blocked (HTTP 403 Forbidden) from Admin product creation'
    );

    // 14. Public API does not expose private data
    console.log('\n--- TEST 14: Private Data Protection ---');
    const anyPrivateField =
      'passwordHash' in slugData.product ||
      'adminId' in slugData.product ||
      'session' in slugData.product ||
      'token' in slugData.product;
    assert(
      !anyPrivateField,
      '14. Public product API does NOT expose passwords, admin IDs, sessions, or tokens'
    );

    // 15. Digital keys are never exposed publicly
    console.log('\n--- TEST 15: Digital Key Protection ---');
    const anyKeyField =
      'keys' in slugData.product ||
      'cipherText' in slugData.product ||
      'productKeys' in slugData.product ||
      'iv' in slugData.product ||
      'tag' in slugData.product;
    assert(
      !anyKeyField,
      '15. AES-256 digital keys and ciphertext are completely absent from public product API'
    );

  } finally {
    // Cleanup temporary test items
    if (testDraftProduct) await db.product.delete({ where: { id: testDraftProduct.id } });
    if (testUnpublishedProduct) await db.product.delete({ where: { id: testUnpublishedProduct.id } });
    if (testPublishedProduct) await db.product.delete({ where: { id: testPublishedProduct.id } });
    if (testOutOfStockProduct) await db.product.delete({ where: { id: testOutOfStockProduct.id } });
  }

  console.log('\n================================================================');
  console.log(`  STEP 3 VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep3Tests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
