import http from 'http';

type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'production';

function fetchHealth(url: string): Promise<{ statusCode: number; json: any | null }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET'
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
            json: parsedJson
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runProductionHealthTests() {
  console.log("====================================================");
  console.log(`RUNNING PRODUCTION SYSTEM HEALTH & INTEGRITY SUITE [Execution Level: ${CURRENT_LEVEL}]`);
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
    console.warn("   To run live production health verification, set PRODUCTION_BASE_URL to the external HTTPS endpoint.");
    process.exit(2);
  }

  try {
    const health = await fetchHealth(`${baseUrl}/api/health`);
    assert(health.statusCode === 200, "Health endpoint returned HTTP 200 OK");
    
    if (health.json) {
      assert(health.json.status === 'ok' || health.json.status === 'healthy', "Overall status is healthy");
      assert('api' in health.json || 'checkedAt' in health.json || 'services' in health.json || 'timestamp' in health.json, "Health payload contains service breakdown or timestamp");
      assert('latencyMs' in health.json || typeof health.json.uptime === 'number', "Health payload contains performance latency metrics");
    } else {
      assert(false, "Health endpoint returned null JSON payload");
    }
  } catch (e: any) {
    assert(false, `Health check exception: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`PRODUCTION HEALTH TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runProductionHealthTests().catch(err => {
  console.error("Fatal error in Production Health test:", err);
  process.exit(1);
});
