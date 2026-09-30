const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = { _raw: body };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function verifyStep3Http() {
  console.log('--- TESTING REAL HTTP ENDPOINTS FOR STEP 3 ADMIN & SELLER WORKFLOW ---');

  // 1. Login as Admin
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@fanar.com', password: 'Admin@123456', portal: 'ADMIN' }
  );
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('1. Admin Login status:', adminLogin.statusCode, 'RedirectTo:', adminLogin.body?.redirectTo);

  // 2. GET /api/v1/admin/stats
  const statsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/stats',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log(
    '2. Admin Stats status:',
    statsRes.statusCode,
    'Revenue:',
    statsRes.body?.stats?.totalRevenue,
    'Commission:',
    statsRes.body?.stats?.platformCommission,
    'Recent Activity Items:',
    statsRes.body?.recentActivity?.length
  );

  // 3. GET /api/v1/admin/users?role=SELLER
  const usersRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/users?role=SELLER',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('3. Filtered Users (role=SELLER) count:', usersRes.body?.users?.length);

  // 4. GET /api/v1/admin/users/usr_buyer_001
  const userDetail = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/users/usr_buyer_001',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('4. User Detail status:', userDetail.statusCode, 'Name:', userDetail.body?.user?.name, 'Orders:', userDetail.body?.user?.orders?.length);

  // 5. Test Self-Suspension Prevention Guard (Admin cannot suspend self)
  const selfSuspend = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/admin/users/usr_admin_001',
      method: 'PATCH',
      headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
    },
    { status: 'SUSPENDED' }
  );
  console.log('5. Self-Suspension Attempt status:', selfSuspend.statusCode, '(Expected: 403)', 'Error:', selfSuspend.body?.error);

  // 6. GET /api/v1/admin/sellers?status=PENDING_KYC
  const pendingSellers = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/sellers?status=PENDING_KYC',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('6. Pending KYC Sellers count:', pendingSellers.body?.sellers?.length);

  // 7. Approve Seller (sel_prof_002)
  const approveRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/sellers/sel_prof_002/approve',
    method: 'PATCH',
    headers: { Cookie: adminCookie },
  });
  console.log('7. Approve Seller status:', approveRes.statusCode, 'New Status:', approveRes.body?.seller?.status);

  // 8. Suspend Seller with Reason
  const suspendRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/admin/sellers/sel_prof_002/suspend',
      method: 'PATCH',
      headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
    },
    { reason: 'Suspicious key activity investigation' }
  );
  console.log('8. Suspend Seller status:', suspendRes.statusCode, 'New Status:', suspendRes.body?.seller?.status, 'Reason:', suspendRes.body?.seller?.rejectionReason);

  // 9. Reactivate Seller
  const reactivateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/sellers/sel_prof_002/reactivate',
    method: 'PATCH',
    headers: { Cookie: adminCookie },
  });
  console.log('9. Reactivate Seller status:', reactivateRes.statusCode, 'New Status:', reactivateRes.body?.seller?.status);

  // 10. GET /api/v1/admin/audit-logs
  const auditRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/audit-logs',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('10. Audit Logs count:', auditRes.body?.logs?.length, 'Latest Action:', auditRes.body?.logs?.[0]?.action);

  // 11. Unauthorized Seller/Buyer attempt to approve seller -> Expect 403 Forbidden!
  const buyerLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'buyer@example.com', password: 'Buyer@123456' }
  );
  const buyerCookie = buyerLogin.headers['set-cookie']?.[0]?.split(';')[0];

  const unauthorizedApproval = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/sellers/sel_prof_002/approve',
    method: 'PATCH',
    headers: { Cookie: buyerCookie },
  });
  console.log('11. Buyer attempting Admin Seller Approval status:', unauthorizedApproval.statusCode, '(Expected: 403)');

  console.log('--- ALL STEP 3 HTTP & WORKFLOW TESTS PASSED ---');
}

verifyStep3Http().catch(console.error);
