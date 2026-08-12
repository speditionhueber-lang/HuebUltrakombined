import http from 'http';

function fetchUrl(url: string, method = 'GET', body: any = null, headers: any = {}): Promise<{ statusCode: number; data: string; json: any | null }> {
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
            json: parsedJson
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) { req.write(postData); }
    req.end();
  });
}

async function runRuntimeProductionTests() {
  console.log("====================================================");
  console.log("RUNNING PRODUCTION RUNTIME VERIFICATION SUITE");
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

  // 1. Root page health
  try {
    const rootRes = await fetchUrl('http://localhost:3000/');
    assert(rootRes.statusCode === 200, "Root page HTTP 200 OK");
  } catch (e: any) {
    assert(false, `Server accessibility check failed: ${e.message}`);
  }

  // 2. /api/health check
  try {
    const healthRes = await fetchUrl('http://localhost:3000/api/health');
    assert(healthRes.statusCode === 200, "/api/health endpoint returned HTTP 200 OK");
    assert(healthRes.json && (healthRes.json.status === 'ok' || healthRes.json.status === 'healthy'), "/api/health returned healthy status");
  } catch (e: any) {
    assert(false, `/api/health check failed: ${e.message}`);
  }

  // 3. Config check
  try {
    const configRes = await fetchUrl('http://localhost:3000/api/config');
    assert(configRes.statusCode === 200, "/api/config returned HTTP 200 OK");
    assert(configRes.json && !('apiKey' in configRes.json) && !('secret' in configRes.json), "/api/config exposes no private secrets");
  } catch (e: any) {
    assert(false, `/api/config check failed: ${e.message}`);
  }

  // 4. Unknown route 404
  try {
    const nonExistentRes = await fetchUrl('http://localhost:3000/api/invalid-route-xyz');
    assert(nonExistentRes.statusCode === 404, "Invalid API path returns controlled 404 JSON");
  } catch (e: any) {
    assert(false, `404 check failed: ${e.message}`);
  }

  // 5. Unauthenticated API protection
  try {
    const protectedRes = await fetchUrl('http://localhost:3000/api/drive/folders');
    assert(protectedRes.statusCode === 401, "Protected API requires Bearer authentication (401)");
  } catch (e: any) {
    assert(false, `Auth check failed: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`PRODUCTION RUNTIME TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runRuntimeProductionTests().catch(err => {
  console.error("Fatal error in Production Runtime test:", err);
  process.exit(1);
});
