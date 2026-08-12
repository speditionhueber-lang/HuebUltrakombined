import http from 'http';
import { spawn, ChildProcess } from 'child_process';

function fetchUrl(url: string, method = 'GET', body: any = null): Promise<{ statusCode: number; data: string; json: any | null }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = body ? JSON.stringify(body) : '';
    
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: body ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        } : {}
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

    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runDevServerTest() {
  console.log("====================================================");
  console.log("RUNNING DEV SERVER & API ROUTES VERIFICATION SUITE");
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

  // 1. Verify HTTP connection to running server at http://localhost:3000
  try {
    const rootRes = await fetchUrl('http://localhost:3000/');
    assert(rootRes.statusCode === 200, `Root endpoint / returned status 200 OK (got ${rootRes.statusCode})`);
    assert(rootRes.data.includes('<html') || rootRes.data.includes('<!DOCTYPE html>') || rootRes.data.includes('vite'), `Root endpoint contains valid HTML/Vite entry markup`);
  } catch (e: any) {
    assert(false, `Dev server is accessible at http://localhost:3000/ (${e.message})`);
  }

  // 2. Test /api/config
  try {
    const configRes = await fetchUrl('http://localhost:3000/api/config');
    assert(configRes.statusCode === 200, `/api/config returned status 200 OK`);
    assert(configRes.json !== null && typeof configRes.json === 'object', `/api/config returned valid JSON object`);
    assert(configRes.json && 'azureTenantId' in configRes.json, `/api/config contains azureTenantId field`);
  } catch (e: any) {
    assert(false, `/api/config endpoint accessible (${e.message})`);
  }

  // 3. Test /api/drive/folders (Should return 401 Unauthorized)
  try {
    const driveRes = await fetchUrl('http://localhost:3000/api/drive/folders');
    assert(driveRes.statusCode === 401, `/api/drive/folders returned status 401 Unauthorized (got ${driveRes.statusCode})`);
  } catch (e: any) {
    assert(false, `/api/drive/folders endpoint accessible (${e.message})`);
  }

  // 4. Test /api/ai/analyze-inbox (Should return 401 Unauthorized)
  try {
    const inboxRes = await fetchUrl('http://localhost:3000/api/ai/analyze-inbox', 'POST', { emails: [], events: [] });
    assert(inboxRes.statusCode === 401, `/api/ai/analyze-inbox returned status 401 Unauthorized (got ${inboxRes.statusCode})`);
  } catch (e: any) {
    assert(false, `/api/ai/analyze-inbox endpoint accessible (${e.message})`);
  }

  // 5. Test controlled 404 for unknown route
  try {
    const unknownRes = await fetchUrl('http://localhost:3000/api/unknown-nonexistent-route-12345');
    assert(unknownRes.statusCode === 404, `Unknown API route returned controlled 404 Not Found (got ${unknownRes.statusCode})`);
  } catch (e: any) {
    assert(false, `Unknown API route handles 404 properly (${e.message})`);
  }

  console.log("====================================================");
  console.log(`DEV SERVER VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDevServerTest().catch((err) => {
  console.error("Fatal error during dev server verification:", err);
  process.exit(1);
});
