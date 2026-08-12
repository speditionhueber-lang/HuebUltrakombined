import http from 'http';

function fetchPost(url: string, body: any, headers: any = {}): Promise<{ statusCode: number; json: any | null }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(body);
    
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsedJson = null;
          try { parsedJson = JSON.parse(rawData); } catch (e) {}
          resolve({ statusCode: res.statusCode || 0, json: parsedJson });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function runAdminClaimsSecurityTests() {
  console.log("====================================================");
  console.log("RUNNING ADMIN CLAIMS & ROLE SECURITY SUITE");
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Missing Admin Key
  try {
    const res1 = await fetchPost('http://localhost:3000/api/admin/set-claims', {
      uid: 'user-123',
      companyId: 'company_hueber',
      role: 'admin'
    });
    assert(res1.statusCode === 403, "Request without Admin API Key rejected with HTTP 403 Forbidden");
  } catch (e: any) {
    assert(false, `Missing admin key check failed: ${e.message}`);
  }

  // 2. Invalid Admin Key
  try {
    const res2 = await fetchPost('http://localhost:3000/api/admin/set-claims', {
      uid: 'user-123',
      companyId: 'company_hueber',
      role: 'admin'
    }, { 'x-admin-api-key': 'WRONG_KEY_999' });
    assert(res2.statusCode === 403, "Request with invalid Admin API Key rejected with HTTP 403 Forbidden");
  } catch (e: any) {
    assert(false, `Invalid admin key check failed: ${e.message}`);
  }

  // 3. Invalid Role Whitelist Check
  const mockAdminKey = process.env.ADMIN_API_KEY || 'your_admin_secret_key';
  try {
    const res3 = await fetchPost('http://localhost:3000/api/admin/set-claims', {
      uid: 'user-123',
      companyId: 'company_hueber',
      role: 'supergod' // invalid role not in whitelist
    }, { 'x-admin-api-key': mockAdminKey });
    assert(res3.statusCode === 400, "Request with un-whitelisted role rejected with HTTP 400 Bad Request");
  } catch (e: any) {
    assert(false, `Role whitelist check failed: ${e.message}`);
  }

  // 4. Missing required payload fields
  try {
    const res4 = await fetchPost('http://localhost:3000/api/admin/set-claims', {
      uid: 'user-123'
    }, { 'x-admin-api-key': mockAdminKey });
    assert(res4.statusCode === 400, "Request missing companyId/role rejected with HTTP 400 Bad Request");
  } catch (e: any) {
    assert(false, `Missing fields check failed: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`ADMIN CLAIMS SECURITY TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runAdminClaimsSecurityTests().catch(err => {
  console.error("Fatal error in Admin Claims Security test:", err);
  process.exit(1);
});
