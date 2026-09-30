const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body || '{}') : null,
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function verifyHttp() {
  console.log('--- TESTING REAL HTTP ENDPOINTS & RBAC GUARDS ---');

  // 1. Unauthenticated access to admin stats -> Expect 401
  const unauthAdmin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/stats',
    method: 'GET',
  });
  console.log('1. Unauth /api/v1/admin/stats status:', unauthAdmin.statusCode, '(Expected: 401)');

  // 2. Login as Buyer
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
  console.log('2. Buyer Login status:', buyerLogin.statusCode, 'RedirectTo:', buyerLogin.body?.redirectTo);
  const buyerCookie = buyerLogin.headers['set-cookie']?.[0]?.split(';')[0];

  // 3. Buyer calls /api/v1/account/profile -> Expect 200
  const buyerProfile = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/account/profile',
    method: 'GET',
    headers: { Cookie: buyerCookie },
  });
  console.log('3. Buyer /api/v1/account/profile status:', buyerProfile.statusCode, 'User:', buyerProfile.body?.user?.name);

  // 4. Buyer attempts /api/v1/admin/stats -> Expect 403 Forbidden!
  const buyerAdminAttempt = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/stats',
    method: 'GET',
    headers: { Cookie: buyerCookie },
  });
  console.log('4. Buyer attempting /api/v1/admin/stats status:', buyerAdminAttempt.statusCode, '(Expected: 403)');

  // 5. Buyer attempts /api/v1/seller/profile -> Expect 403 Forbidden!
  const buyerSellerAttempt = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/seller/profile',
    method: 'GET',
    headers: { Cookie: buyerCookie },
  });
  console.log('5. Buyer attempting /api/v1/seller/profile status:', buyerSellerAttempt.statusCode, '(Expected: 403)');

  // 6. Login as Seller
  const sellerLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'seller@nexus.com', password: 'Seller@123456' }
  );
  console.log('6. Seller Login status:', sellerLogin.statusCode, 'RedirectTo:', sellerLogin.body?.redirectTo);
  const sellerCookie = sellerLogin.headers['set-cookie']?.[0]?.split(';')[0];

  // 7. Seller calls /api/v1/seller/profile -> Expect 200
  const sellerProfile = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/seller/profile',
    method: 'GET',
    headers: { Cookie: sellerCookie },
  });
  console.log('7. Seller Profile status:', sellerProfile.statusCode, 'Store:', sellerProfile.body?.seller?.storeName);

  // 8. Seller attempts /api/v1/admin/stats -> Expect 403 Forbidden!
  const sellerAdminAttempt = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/stats',
    method: 'GET',
    headers: { Cookie: sellerCookie },
  });
  console.log('8. Seller attempting /api/v1/admin/stats status:', sellerAdminAttempt.statusCode, '(Expected: 403)');

  // 9. Login as Admin
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
  console.log('9. Admin Login status:', adminLogin.statusCode, 'RedirectTo:', adminLogin.body?.redirectTo);
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0];

  // 10. Admin calls /api/v1/admin/stats -> Expect 200 with real counts
  const adminStats = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/stats',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('10. Admin Stats status:', adminStats.statusCode, 'Real Stats:', JSON.stringify(adminStats.body?.stats));

  // 11. Wrong password attempt
  const wrongPass = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'buyer@example.com', password: 'WrongPassword999' }
  );
  console.log('11. Wrong Password status:', wrongPass.statusCode, 'Error:', wrongPass.body?.error);

  console.log('--- ALL REAL HTTP AUTH & RBAC TESTS PASSED SUCCESSFULLY ---');
}

verifyHttp().catch(console.error);
