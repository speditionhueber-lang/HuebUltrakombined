import http from 'http';

function fetchUrl(url: string, method = 'GET', body: any = null, headers: any = {}): Promise<{ statusCode: number }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = body ? JSON.stringify(body) : '';
    
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          ...headers,
          ...(body ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          } : {})
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0 });
        });
      }
    );
    req.on('error', (err) => reject(err));
    if (body) { req.write(postData); }
    req.end();
  });
}

async function runSecurityTests() {
  console.log("====================================================");
  console.log("RUNNING API SECURITY & ADMIN VERIFICATION SUITE");
  console.log("====================================================");

  let passed = 0; let failed = 0;
  function assert(condition: boolean, message: string) {
    if (condition) { console.log(`✓ [PASS] ${message}`); passed++; } 
    else { console.error(`✗ [FAIL] ${message}`); failed++; }
  }

  // 1. Protected routes without token
  try {
    const res = await fetchUrl('http://localhost:3000/api/drive/folders');
    assert(res.statusCode === 401, 'Unauthenticated request to /api/drive/folders returns 401 Unauthorized');
  } catch (e: any) { assert(false, `Request failed: ${e.message}`); }

  try {
    const res = await fetchUrl('http://localhost:3000/api/ai/analyze-inbox', 'POST', { emails: [] });
    assert(res.statusCode === 401, 'Unauthenticated request to /api/ai/analyze-inbox returns 401 Unauthorized');
  } catch (e: any) { assert(false, `Request failed: ${e.message}`); }

  // 2. Admin endpoint without API key
  try {
    const res = await fetchUrl('http://localhost:3000/api/admin/set-claims', 'POST', { uid: '123', companyId: 'company_a', role: 'admin' });
    assert(res.statusCode === 403, 'Request to /api/admin/set-claims without API key returns 403 Forbidden');
  } catch (e: any) { assert(false, `Request failed: ${e.message}`); }

  // 3. Health endpoint is public
  try {
    const res = await fetchUrl('http://localhost:3000/api/health');
    assert(res.statusCode === 200, 'Health check /api/health is publicly accessible (200 OK)');
  } catch (e: any) { assert(false, `Request failed: ${e.message}`); }

  console.log("====================================================");
  console.log(`API SECURITY VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");
  if (failed > 0) process.exit(1);
}

runSecurityTests().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
