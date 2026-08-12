import http from 'http';

function fetchGet(url: string): Promise<{ statusCode: number; json: any | null }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let parsedJson = null;
        try { parsedJson = JSON.parse(rawData); } catch (e) {}
        resolve({ statusCode: res.statusCode || 0, json: parsedJson });
      });
    }).on('error', (err) => reject(err));
  });
}

async function runHealthIntegrityTests() {
  console.log("====================================================");
  console.log("RUNNING HEALTH ENDPOINT & INTEGRITY SUITE");
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

  try {
    const res = await fetchGet('http://localhost:3000/api/health');
    assert(res.statusCode === 200, "Health check returned HTTP 200 OK");
    
    const body = res.json || {};
    assert(body.status === 'healthy', "Overall system status reported as 'healthy'");
    assert(typeof body.latencyMs === 'number', "Health check includes measured latencyMs");
    assert(!!body.checkedAt, "Health check includes ISO timestamp checkedAt");
    assert(body.api && body.api.status === 'healthy', "Express API component healthy");
    assert(body.firestore && body.firestore.status === 'healthy', "Firestore component healthy");
    assert(body.storage && body.storage.status === 'healthy', "Storage component healthy");
    assert(typeof body.pendingSyncs === 'number', "Pending syncs count monitored");
    assert(typeof body.openCriticalExceptions === 'number', "Open critical exceptions monitored");
  } catch (e: any) {
    assert(false, `Health check call failed: ${e.message}`);
  }

  console.log("====================================================");
  console.log(`HEALTH INTEGRITY TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runHealthIntegrityTests().catch(err => {
  console.error("Fatal error in Health Integrity test:", err);
  process.exit(1);
});
