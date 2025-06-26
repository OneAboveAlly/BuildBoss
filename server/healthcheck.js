const http = require('http');

// Get health check mode from command line args or environment
const mode = process.argv[2] || process.env.HEALTH_CHECK_MODE || 'basic';
const timeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10);

// Define health check endpoints
const endpoints = {
  basic: '/api/health',
  detailed: '/api/health/detailed',
  database: '/api/health/database',
  system: '/api/health/system'
};

const checkEndpoint = endpoints[mode] || endpoints.basic;

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: checkEndpoint,
  method: 'GET',
  timeout
};

console.log(`Running ${mode} health check on ${checkEndpoint}...`);

const request = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log(`✅ Health check passed (${res.statusCode})`);

        // For detailed checks, show component status
        if (mode === 'detailed' && response.checks) {
          console.log('Component Status:');
          Object.entries(response.checks).forEach(([component, check]) => {
            const status = check.status;
            const icon = status === 'OK' ? '✅' :
              status === 'WARNING' ? '⚠️' :
                status === 'CRITICAL' ? '❌' :
                  status === 'N/A' ? '➖' : '❓';
            console.log(`  ${icon} ${component}: ${status}`);
          });

          if (response.uptime) {
            console.log(`⏱️  Uptime: ${Math.round(response.uptime)}s`);
          }
        }

        process.exit(0);
      } else {
        console.error(`❌ Health check failed with status ${res.statusCode}`);
        console.error(`Response: ${JSON.stringify(response, null, 2)}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Failed to parse health check response: ${error.message}`);
      console.error(`Raw response: ${data}`);
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.error(`❌ Health check error: ${err.message}`);
  process.exit(1);
});

request.on('timeout', () => {
  console.error(`❌ Health check timeout after ${timeout}ms`);
  request.destroy();
  process.exit(1);
});

// Set timeout
request.setTimeout(timeout);

request.end();
