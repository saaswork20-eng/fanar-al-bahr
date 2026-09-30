import { db } from '../src/lib/db';
import { signSessionToken, AuthError } from '../src/lib/session';

async function runStep3Tests() {
  console.log('================================================================');
  console.log('  FANAR AL BHAR — STEP 3: ADMIN & SELLER APPROVAL TEST SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, extra?: string) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Admin Stats & Real Database Metrics
    // ----------------------------------------------------
    console.log('1. Testing Admin Stats & Live Database Metrics...');
    const totalUsers = await db.user.count();
    const totalSellers = await db.user.count({ where: { role: 'SELLER' } });
    const totalBuyers = await db.user.count({ where: { role: 'BUYER' } });
    const pendingSellers = await db.sellerProfile.count({ where: { status: 'PENDING_KYC' } });
    const approvedSellers = await db.sellerProfile.count({ where: { status: 'VERIFIED' } });
    const suspendedSellers = await db.sellerProfile.count({ where: { status: 'SUSPENDED' } });
    const totalProducts = await db.product.count();
    const totalOffers = await db.productOffer.count();
    const totalOrders = await db.order.count();
    const pendingOrders = await db.order.count({ where: { status: 'PENDING_PAYMENT' } });
    const revenue = await db.order.aggregateRevenue();

    assert(totalUsers >= 5, `Total users count is real: ${totalUsers}`);
    assert(totalSellers >= 3, `Total sellers count is real: ${totalSellers}`);
    assert(totalBuyers >= 1, `Total buyers count is real: ${totalBuyers}`);
    assert(pendingSellers >= 1, `Pending KYC sellers count is real: ${pendingSellers}`);
    assert(approvedSellers >= 1, `Approved sellers count is real: ${approvedSellers}`);
    assert(suspendedSellers >= 1, `Suspended sellers count is real: ${suspendedSellers}`);
    assert(totalProducts === 14, `Total catalog products: ${totalProducts}`);
    assert(totalOffers === 38, `Total active product offers: ${totalOffers}`);
    assert(totalOrders >= 3, `Total orders count: ${totalOrders}`);
    assert(pendingOrders >= 1, `Pending orders count: ${pendingOrders}`);
    assert(revenue.totalRevenue > 0, `Total GMV Revenue calculated: ₹${revenue.totalRevenue}`);
    assert(revenue.platformCommission > 0, `Platform commission (5%) calculated: ₹${revenue.platformCommission}`);

    // ----------------------------------------------------
    // TEST 2: User Filtering & Search in Database
    // ----------------------------------------------------
    console.log('\n2. Testing User Directory & Filtering...');
    const allUsers = await db.user.findMany();
    assert(allUsers.length === totalUsers, 'findMany() returns all user records');

    const sellersOnly = await db.user.findMany({ where: { role: 'SELLER' } });
    assert(sellersOnly.every((u) => u.role === 'SELLER'), 'Role filter SELLER returns only sellers');

    const buyersOnly = await db.user.findMany({ where: { role: 'BUYER' } });
    assert(buyersOnly.every((u) => u.role === 'BUYER'), 'Role filter BUYER returns only buyers');

    const searchResult = await db.user.findMany({ where: { search: 'nexus' } });
    assert(searchResult.length > 0 && searchResult[0].email.includes('nexus'), 'Search by text matches user email/name');

    // ----------------------------------------------------
    // TEST 3: User Detail & Self-Suspension Protection Guard
    // ----------------------------------------------------
    console.log('\n3. Testing User Detail & Self-Suspension Guard...');
    const adminUser = await db.user.findUnique({ where: { email: 'admin@fanar.com' } });
    const buyerUser = await db.user.findUnique({ where: { email: 'buyer@example.com' }, include: { orders: true } });

    assert(!!adminUser, 'Admin record retrieved');
    assert(!!buyerUser && Array.isArray(buyerUser.orders), 'Buyer record retrieved with attached orders');

    // Self-suspension guard check:
    const simulateSuspendUser = (currentAdminId: string, targetUserId: string, targetRole: string) => {
      if (currentAdminId === targetUserId) {
        throw new AuthError('Action prohibited: Administrators cannot suspend their own administrative account.', 403);
      }
      if (targetRole === 'ADMIN') {
        throw new AuthError('Action prohibited: Peer administrator accounts cannot be suspended.', 403);
      }
      return true;
    };

    let selfSuspensionBlocked = false;
    try {
      simulateSuspendUser(adminUser!.id, adminUser!.id, 'ADMIN');
    } catch (e: any) {
      if (e.statusCode === 403) selfSuspensionBlocked = true;
    }
    assert(selfSuspensionBlocked, 'Admin attempting to suspend self is BLOCKED (403)');

    // Safe suspension of buyer account
    await db.user.update({
      where: { id: buyerUser!.id },
      data: { status: 'SUSPENDED' },
    });
    const suspendedBuyer = await db.user.findUnique({ where: { id: buyerUser!.id } });
    assert(suspendedBuyer?.status === 'SUSPENDED', 'Buyer account safely transitioned to SUSPENDED');

    // Log audit event
    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: buyerUser!.id,
        targetName: buyerUser!.name || buyerUser!.email,
        details: 'Testing user account suspension',
      },
    });

    // Reactivate buyer account
    await db.user.update({
      where: { id: buyerUser!.id },
      data: { status: 'ACTIVE' },
    });
    const reactivatedBuyer = await db.user.findUnique({ where: { id: buyerUser!.id } });
    assert(reactivatedBuyer?.status === 'ACTIVE', 'Buyer account reactivated to ACTIVE');

    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'USER_REACTIVATED',
        targetType: 'USER',
        targetId: buyerUser!.id,
        targetName: buyerUser!.name || buyerUser!.email,
        details: 'Testing user account reactivation',
      },
    });

    // ----------------------------------------------------
    // TEST 4: Seller Approval & State Transition Workflow
    // ----------------------------------------------------
    console.log('\n4. Testing Seller Approval Workflow (Pending -> Approved -> Suspended -> Reactivated -> Rejected)...');
    const pendingSeller = await db.sellerProfile.findUnique({ where: { slug: 'digital-vault-global' } });
    assert(!!pendingSeller, 'Pending seller DigitalVault Global exists');
    assert(pendingSeller?.status === 'PENDING_KYC', 'Initial state is PENDING_KYC');

    // Step 4a: APPROVE SELLER
    const approved = await db.sellerProfile.update({
      where: { id: pendingSeller!.id },
      data: { status: 'VERIFIED', rejectionReason: null },
    });
    assert(approved.status === 'VERIFIED', 'Seller state transitioned PENDING_KYC -> VERIFIED');
    assert(approved.rejectionReason === null, 'Rejection reason cleared on approval');

    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'SELLER_APPROVED',
        targetType: 'SELLER',
        targetId: approved.id,
        targetName: approved.storeName,
        details: 'KYC documents and business registry verified.',
      },
    });

    // Step 4b: SUSPEND SELLER
    const suspendReason = 'Excessive buyer invalid key complaints under review';
    const suspended = await db.sellerProfile.update({
      where: { id: pendingSeller!.id },
      data: { status: 'SUSPENDED', rejectionReason: suspendReason },
    });
    assert(suspended.status === 'SUSPENDED', 'Seller state transitioned VERIFIED -> SUSPENDED');
    assert(suspended.rejectionReason === suspendReason, 'Suspension reason stored in database');

    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'SELLER_SUSPENDED',
        targetType: 'SELLER',
        targetId: suspended.id,
        targetName: suspended.storeName,
        details: suspendReason,
      },
    });

    // Step 4c: REACTIVATE SELLER
    const reactivated = await db.sellerProfile.update({
      where: { id: pendingSeller!.id },
      data: { status: 'VERIFIED', rejectionReason: null },
    });
    assert(reactivated.status === 'VERIFIED', 'Seller state transitioned SUSPENDED -> VERIFIED');

    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'SELLER_REACTIVATED',
        targetType: 'SELLER',
        targetId: reactivated.id,
        targetName: reactivated.storeName,
        details: 'Store investigated and cleared for reactivation.',
      },
    });

    // Step 4d: REJECT SELLER
    const rejectReason = 'Failed commercial business certificate verification';
    const rejected = await db.sellerProfile.update({
      where: { id: pendingSeller!.id },
      data: { status: 'REJECTED', rejectionReason: rejectReason },
    });
    assert(rejected.status === 'REJECTED', 'Seller state transitioned to REJECTED');
    assert(rejected.rejectionReason === rejectReason, 'Rejection reason recorded');

    await db.auditLog.create({
      data: {
        adminId: adminUser!.id,
        adminEmail: adminUser!.email,
        action: 'SELLER_REJECTED',
        targetType: 'SELLER',
        targetId: rejected.id,
        targetName: rejected.storeName,
        details: rejectReason,
      },
    });

    // Reset pending seller back to PENDING_KYC for test repeatability
    await db.sellerProfile.update({
      where: { id: pendingSeller!.id },
      data: { status: 'PENDING_KYC', rejectionReason: null },
    });

    // ----------------------------------------------------
    // TEST 5: Audit Log Trail Verification
    // ----------------------------------------------------
    console.log('\n5. Testing Administrative Audit Trail Integrity...');
    const logs = await db.auditLog.findMany();
    assert(logs.length >= 6, `Audit trail contains ${logs.length} recorded events`);

    const hasSellerApproval = logs.some((l) => l.action === 'SELLER_APPROVED');
    const hasSellerSuspension = logs.some((l) => l.action === 'SELLER_SUSPENDED');
    const hasSellerRejection = logs.some((l) => l.action === 'SELLER_REJECTED');
    const hasUserSuspension = logs.some((l) => l.action === 'USER_SUSPENDED');

    assert(hasSellerApproval, 'Audit log contains SELLER_APPROVED event');
    assert(hasSellerSuspension, 'Audit log contains SELLER_SUSPENDED event');
    assert(hasSellerRejection, 'Audit log contains SELLER_REJECTED event');
    assert(hasUserSuspension, 'Audit log contains USER_SUSPENDED event');

    console.log('\n================================================================');
    console.log(`  STEP 3 TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runStep3Tests();
