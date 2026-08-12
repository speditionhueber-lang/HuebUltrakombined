import http from 'http';

type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'staging';

function fetchUrl(url: string, headers: Record<string, string> = {}): Promise<{ statusCode: number; headers: any; body: string; json: any | null }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runStagingRuntimeTests() {
  console.log("====================================================");
  console.log(`RUNNING STAGING RUNTIME SUITE [Execution Level: ${CURRENT_LEVEL}]`);
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ [PASS] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      failed++;
    }
  }

  // 1. Homepage returns 200
  try {
    const rootRes = await fetchUrl('http://localhost:3000/');
    assert(rootRes.statusCode === 200, "Staging root endpoint returns HTTP 200 OK");
  } catch (e: any) {
    assert(false, `Root endpoint unreachable: ${e.message}`);
  }

  // 2. Health check endpoint
  try {
    const healthRes = await fetchUrl('http://localhost:3000/api/health');
    assert(healthRes.statusCode === 200, "/api/health returns HTTP 200 OK");
    assert(healthRes.json && healthRes.json.status === 'healthy', "System reports 'healthy' status");
    assert(healthRes.json && typeof healthRes.json.latencyMs === 'number', "Latency is monitored");
  } catch (e: any) {
    assert(false, `Health check failed: ${e.message}`);
  }

  // 3. Config endpoint secret isolation
  try {
    const configRes = await fetchUrl('http://localhost:3000/api/config');
    assert(configRes.statusCode === 200, "/api/config returns HTTP 200 OK");
    assert(!configRes.body.includes('FIREBASE_ADMIN_KEY') && !configRes.body.includes('AZURE_CLIENT_SECRET'), "Config endpoint exposes no private backend secrets");
  } catch (e: any) {
    assert(false, `Config endpoint check failed: ${e.message}`);
  }

  // 4. Unknown route 404 JSON
  try {
    const unknownRes = await fetchUrl('http://localhost:3000/api/nonexistent-route-12345');
    assert(unknownRes.statusCode === 404, "Unknown API route returns HTTP 404");
  } catch (e: any) {
    assert(false, `Unknown route check failed: ${e.message}`);
  }

  // 5. Protected API 401
  try {
    const protectedRes = await fetchUrl('http://localhost:3000/api/protected/resource');
    assert(protectedRes.statusCode === 401, "Protected route requires Bearer authentication (HTTP 401)");
  } catch (e: any) {
    assert(false, `Protected route check failed: ${e.message}`);
  }

  // 6. Security headers check
  try {
    const rootRes = await fetchUrl('http://localhost:3000/');
    const headers = rootRes.headers;
    assert(headers['x-content-type-options'] === 'nosniff', "X-Content-Type-Options: nosniff header present");
    assert(headers['x-frame-options'] === 'SAMEORIGIN', "X-Frame-Options: SAMEORIGIN header present");
    assert(!!headers['referrer-policy'], "Referrer-Policy header present");
    assert(!!headers['permissions-policy'], "Permissions-Policy header present");
  } catch (e: any) {
    assert(false, `Security headers check failed: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`STAGING RUNTIME TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runStagingRuntimeTests().catch(err => {
  console.error("Fatal error in Staging Runtime test:", err);
  process.exit(1);
});
