import http from 'http';

type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'production';

function fetchUrl(url: string, method = 'GET', body: any = null, headers: any = {}): Promise<{ statusCode: number; data: string; json: any | null; headers: http.IncomingHttpHeaders }> {
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
          let parsedJson = null;
          try {
            parsedJson = JSON.parse(rawData);
          } catch (e) {
            // Not JSON
          }
          resolve({
            statusCode: res.statusCode || 0,
            data: rawData,
            json: parsedJson,
            headers: res.headers
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) { req.write(postData); }
    req.end();
  });
}

async function runProductionRuntimeTests() {
  console.log("====================================================");
  console.log(`RUNNING PRODUCTION RUNTIME VERIFICATION SUITE [Execution Level: ${CURRENT_LEVEL}]`);
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

  const baseUrl = process.env.PRODUCTION_BASE_URL;

  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    console.warn("⚠️ [NOT_VERIFIED] PRODUCTION_BASE_URL environment variable is missing or set to localhost.");
    console.warn("   To run live production runtime verification, set PRODUCTION_BASE_URL to the external HTTPS endpoint.");
    process.exit(2);
  }

  // 1. Root page health
  try {
    const rootRes = await fetchUrl(`${baseUrl}/`);
    assert(rootRes.statusCode === 200, "Production root page returns HTTP 200 OK");
  } catch (e: any) {
    assert(false, `Root check failed: ${e.message}`);
  }

  // 2. Health endpoint
  try {
    const healthRes = await fetchUrl(`${baseUrl}/api/health`);
    assert(healthRes.statusCode === 200, "/api/health endpoint returned HTTP 200 OK");
    assert(healthRes.json && (healthRes.json.status === 'ok' || healthRes.json.status === 'healthy'), "Production system reports healthy operational status");
  } catch (e: any) {
    assert(false, `Health check failed: ${e.message}`);
  }

  // 3. Config endpoint (no secrets leaked)
  try {
    const configRes = await fetchUrl(`${baseUrl}/api/config`);
    assert(configRes.statusCode === 200, "/api/config returned HTTP 200 OK");
    assert(configRes.json && !('apiKey' in configRes.json) && !('secret' in configRes.json), "Production config endpoint exposes zero backend secrets");
  } catch (e: any) {
    assert(false, `Config check failed: ${e.message}`);
  }

  // 4. Protected endpoint returns 401 without Bearer token
  try {
    const protectedRes = await fetchUrl(`${baseUrl}/api/protected/resource`);
    assert(protectedRes.statusCode === 401, "Protected API requires Bearer authentication (HTTP 401)");
  } catch (e: any) {
    assert(false, `Protected route check failed: ${e.message}`);
  }

  // 5. Security headers
  try {
    const healthRes = await fetchUrl(`${baseUrl}/api/health`);
    const nosniff = healthRes.headers['x-content-type-options'];
    assert(nosniff === 'nosniff', "X-Content-Type-Options: nosniff header enforced in Production");
  } catch (e: any) {
    assert(false, `Header check failed: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`PRODUCTION RUNTIME TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runProductionRuntimeTests().catch(err => {
  console.error("Fatal error in Production Runtime test:", err);
  process.exit(1);
});
