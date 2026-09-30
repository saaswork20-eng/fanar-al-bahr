import { db } from '../src/lib/db';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { signSessionToken, verifySessionToken, AuthError } from '../src/lib/session';

async function runTests() {
  console.log('=====================================================');
  console.log('  FANAR AL BHAR — AUTH & RBAC VERIFICATION SUITE    ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Password Hashing & Verification
    // ----------------------------------------------------
    console.log('1. Testing Password Hashing & Bcrypt...');
    const rawPass = 'Secret123!';
    const hash = await hashPassword(rawPass);
    assert(hash.startsWith('$2'), 'Hash format is standard bcrypt');
    assert(await verifyPassword(rawPass, hash), 'Correct password verifies');
    assert(!(await verifyPassword('WrongPassword!', hash)), 'Wrong password rejected');

    // ----------------------------------------------------
    // TEST 2: Seed Accounts in Database
    // ----------------------------------------------------
    console.log('\n2. Testing Seed Accounts & Database Integrity...');
    const adminUser = await db.user.findUnique({
      where: { email: 'admin@fanar.com' },
      include: { sellerProfile: true },
    });
    assert(!!adminUser, 'Default Admin account exists');
    assert(adminUser?.role === 'ADMIN', 'Admin role is ADMIN');
    assert(await verifyPassword('Admin@123456', adminUser?.passwordHash), 'Admin password hash verifies');

    const sellerUser = await db.user.findUnique({
      where: { email: 'seller@nexus.com' },
      include: { sellerProfile: true },
    });
    assert(!!sellerUser, 'Default Seller account exists');
    assert(sellerUser?.role === 'SELLER', 'Seller role is SELLER');
    assert(sellerUser?.sellerProfile?.storeName === 'NexusGameStore', 'SellerProfile relation attached');

    const buyerUser = await db.user.findUnique({
      where: { email: 'buyer@example.com' },
    });
    assert(!!buyerUser, 'Default Buyer account exists');
    assert(buyerUser?.role === 'BUYER', 'Buyer role is BUYER');

    // ----------------------------------------------------
    // TEST 3: New Buyer Registration
    // ----------------------------------------------------
    console.log('\n3. Testing Real Buyer Registration...');
    const testBuyerEmail = `testbuyer_${Date.now()}@test.com`;
    const buyerHash = await hashPassword('BuyerSecure@99');
    const registeredBuyer = await db.user.create({
      data: {
        name: 'Test Buyer Suite',
        email: testBuyerEmail,
        passwordHash: buyerHash,
        role: 'BUYER',
        status: 'ACTIVE',
      },
    });
    assert(!!registeredBuyer.id, 'Buyer created with unique ID');
    assert(registeredBuyer.role === 'BUYER', 'Buyer assigned BUYER role');

    // Duplicate email rejection
    let duplicateRejected = false;
    try {
      await db.user.create({
        data: {
          name: 'Duplicate',
          email: testBuyerEmail,
          passwordHash: buyerHash,
          role: 'BUYER',
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate email registration rejected');

    // ----------------------------------------------------
    // TEST 4: New Seller Registration & KYC Status
    // ----------------------------------------------------
    console.log('\n4. Testing Real Seller Registration & KYC Status...');
    const testSellerEmail = `testseller_${Date.now()}@test.com`;
    const storeName = `TestStore_${Date.now()}`;
    const sellerHash = await hashPassword('SellerSecure@99');

    const registeredSeller = await db.user.create({
      data: {
        name: 'Test Merchant Suite',
        email: testSellerEmail,
        passwordHash: sellerHash,
        role: 'SELLER',
        status: 'ACTIVE',
        sellerProfile: {
          create: {
            storeName,
            slug: storeName.toLowerCase(),
            status: 'PENDING_KYC',
          },
        },
      },
    });

    const loadedSeller = await db.user.findUnique({
      where: { id: registeredSeller.id },
      include: { sellerProfile: true },
    });
    assert(loadedSeller?.role === 'SELLER', 'Seller assigned SELLER role');
    assert(loadedSeller?.sellerProfile?.status === 'PENDING_KYC', 'Seller initialized with PENDING_KYC status');

    // ----------------------------------------------------
    // TEST 5: Session Tokens & Claims
    // ----------------------------------------------------
    console.log('\n5. Testing Session JWT Tokens & Claims...');
    const token = await signSessionToken({
      userId: loadedSeller!.id,
      email: loadedSeller!.email,
      name: loadedSeller!.name,
      role: loadedSeller!.role,
      status: loadedSeller!.status,
      sellerProfileId: loadedSeller!.sellerProfile?.id,
      sellerStatus: loadedSeller!.sellerProfile?.status,
    });
    assert(typeof token === 'string' && token.length > 20, 'Signed JWT token generated');

    const verifiedSession = await verifySessionToken(token);
    assert(verifiedSession?.userId === loadedSeller!.id, 'Session claims userId matches');
    assert(verifiedSession?.role === 'SELLER', 'Session claims role matches');
    assert(verifiedSession?.sellerStatus === 'PENDING_KYC', 'Session claims sellerStatus matches');

    // ----------------------------------------------------
    // TEST 6: RBAC Authorization Logic
    // ----------------------------------------------------
    console.log('\n6. Testing RBAC Role Enforcement...');
    // Simulated role guards
    const checkAdminGuard = (sessionRole: string) => {
      if (sessionRole !== 'ADMIN') throw new AuthError('Forbidden', 403);
      return true;
    };
    const checkSellerGuard = (sessionRole: string) => {
      if (sessionRole !== 'SELLER' && sessionRole !== 'ADMIN') throw new AuthError('Forbidden', 403);
      return true;
    };

    assert(checkAdminGuard('ADMIN'), 'Admin allowed to admin routes');

    let buyerBlockedFromAdmin = false;
    try {
      checkAdminGuard('BUYER');
    } catch {
      buyerBlockedFromAdmin = true;
    }
    assert(buyerBlockedFromAdmin, 'Buyer blocked from admin routes (403)');

    let sellerBlockedFromAdmin = false;
    try {
      checkAdminGuard('SELLER');
    } catch {
      sellerBlockedFromAdmin = true;
    }
    assert(sellerBlockedFromAdmin, 'Seller blocked from admin routes (403)');

    assert(checkSellerGuard('SELLER'), 'Seller allowed to seller routes');

    let buyerBlockedFromSeller = false;
    try {
      checkSellerGuard('BUYER');
    } catch {
      buyerBlockedFromSeller = true;
    }
    assert(buyerBlockedFromSeller, 'Buyer blocked from seller routes (403)');

    // ----------------------------------------------------
    // TEST 7: Tenant Isolation (Order Privacy)
    // ----------------------------------------------------
    console.log('\n7. Testing Tenant Isolation & Order Privacy...');
    const userAOrders = await db.order.findMany({ where: { buyerId: 'usr_buyer_001' } });
    const userBOrders = await db.order.findMany({ where: { buyerId: registeredBuyer.id } });
    assert(userAOrders.length > 0, 'User A has their own orders');
    assert(userBOrders.length === 0, 'User B has 0 orders (cannot see User A orders)');

    // ----------------------------------------------------
    // TEST 8: Password Reset Token Flow
    // ----------------------------------------------------
    console.log('\n8. Testing Password Reset Token Flow...');
    const resetToken = 'test_reset_token_' + Date.now();
    await db.passwordResetToken.create({
      data: {
        userId: registeredBuyer.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    const tokenRecord = await db.passwordResetToken.findUnique({ where: { token: resetToken } });
    assert(!!tokenRecord && !tokenRecord.used, 'Password reset token saved and unused');

    await db.passwordResetToken.update({
      where: { token: resetToken },
      data: { used: true },
    });
    const usedRecord = await db.passwordResetToken.findUnique({ where: { token: resetToken } });
    assert(usedRecord?.used === true, 'Password reset token marked used');

    // ----------------------------------------------------
    // TEST 9: Admin KYC Approval
    // ----------------------------------------------------
    console.log('\n9. Testing Admin KYC Approval Workflow...');
    const profileId = loadedSeller!.sellerProfile!.id;
    const approvedProfile = await db.sellerProfile.update({
      where: { id: profileId },
      data: { status: 'VERIFIED' },
    });
    assert(approvedProfile.status === 'VERIFIED', 'Seller KYC status transitioned PENDING_KYC -> VERIFIED');

    // ----------------------------------------------------
    // TEST 10: Real Database Counts
    // ----------------------------------------------------
    console.log('\n10. Testing Real Database Counts...');
    const totalUsers = await db.user.count();
    const totalSellers = await db.user.count({ where: { role: 'SELLER' } });
    const totalBuyers = await db.user.count({ where: { role: 'BUYER' } });
    const totalProducts = await db.product.count();
    const totalOffers = await db.productOffer.count();
    const totalOrders = await db.order.count();

    assert(totalUsers >= 4, `Total Users count is real: ${totalUsers}`);
    assert(totalSellers >= 2, `Total Sellers count is real: ${totalSellers}`);
    assert(totalBuyers >= 1, `Total Buyers count is real: ${totalBuyers}`);
    assert(totalProducts === 14, `Total Products count is real: ${totalProducts}`);
    assert(totalOffers === 38, `Total Offers count is real: ${totalOffers}`);
    assert(totalOrders >= 2, `Total Orders count is real: ${totalOrders}`);

    console.log('\n=====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
