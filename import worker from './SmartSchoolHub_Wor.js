import worker from './SmartSchoolHub_Worker.js';

// Mock request
const request = {
  method: 'POST',
  headers: new Headers({
    'Origin': 'http://localhost:8080',
    'Content-Type': 'application/json'
  }),
  url: 'http://localhost/api',
  json: async () => ({ action: 'ping' })
};

// Mock env
const env = {
  WORKER_SECRET: 'test_secret',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
  USE_GOOGLE_SHEETS: 'true',
  USE_CLOUDFLARE_D1: 'false'
};

async function runTest() {
  try {
    const ctx = {
      waitUntil: (promise) => promise
    };
    
    const response = await worker.fetch(request, env, ctx);
    const json = await response.json();
    
    console.log('Test Ping Success:', json);
    
    if (json && json.success) {
      console.log('Worker handler is alive and functional.');
      process.exit(0);
    } else {
      console.error('Test Failed: Unexpected response', json);
      process.exit(1);
    }
  } catch (error) {
    console.error('Test Threw Error:', error);
    process.exit(1);
  }
}

runTest();