#!/usr/bin/env node

const https = require('http');

const ENDPOINTS = [
  {
    name: 'GET /users (All Users)',
    method: 'GET',
    path: '/users',
    headers: { 'x-user-scopes': 'users:read:all' },
    weight: 40 // 40% of requests
  },
  {
    name: 'GET /users/:id (Single User)',
    method: 'GET',
    path: '/users/1',
    headers: { 'x-user-scopes': 'users:read' },
    weight: 35 // 35% of requests
  },
  {
    name: 'POST /users (Create User)',
    method: 'POST',
    path: '/users',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `User_${Date.now()}`,
      email: `user_${Date.now()}@example.com`
    }),
    weight: 25 // 25% of requests
  }
];

// Configuration
const CONFIG = {
  totalRequests: 100,
  delayBetweenRequests: 100, // ms
  concurrentRequests: 5,
  verbose: true
};

class RequestSimulator {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      errors: 0,
      totalTime: 0,
      responses: []
    };
  }

  async makeRequest(endpoint) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint.path,
        method: endpoint.method,
        headers: endpoint.headers || {}
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const duration = Date.now() - startTime;
          const response = {
            endpoint: endpoint.name,
            statusCode: res.statusCode,
            duration: duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
            timestamp: new Date().toISOString()
          };
          
          this.stats.total++;
          this.stats.totalTime += duration;
          
          if (response.success) {
            this.stats.success++;
          } else {
            this.stats.errors++;
          }
          
          this.stats.responses.push(response);
          
          if (CONFIG.verbose) {
            console.log(`✅ ${endpoint.name} - ${res.statusCode} - ${duration}ms`);
          }
          
          resolve(response);
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ ${endpoint.name} - ERROR - ${error.message}`);
        
        this.stats.total++;
        this.stats.errors++;
        this.stats.totalTime += duration;
        
        resolve({
          endpoint: endpoint.name,
          statusCode: 0,
          duration: duration,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      if (endpoint.body) {
        req.write(endpoint.body);
      }
      
      req.end();
    });
  }

  selectEndpoint() {
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    
    for (const endpoint of ENDPOINTS) {
      cumulativeWeight += endpoint.weight;
      if (random <= cumulativeWeight) {
        return endpoint;
      }
    }
    
    return ENDPOINTS[0]; // fallback
  }

  async runSimulation() {
    console.log('🚀 Starting API Load Simulation');
    console.log(`📊 Configuration:`);
    console.log(`   - Total Requests: ${CONFIG.totalRequests}`);
    console.log(`   - Delay Between Requests: ${CONFIG.delayBetweenRequests}ms`);
    console.log(`   - Concurrent Requests: ${CONFIG.concurrentRequests}`);
    console.log(`   - Endpoints: ${ENDPOINTS.length}`);
    console.log('');

    const startTime = Date.now();
    
    // Run requests in batches
    for (let i = 0; i < CONFIG.totalRequests; i += CONFIG.concurrentRequests) {
      const batchSize = Math.min(CONFIG.concurrentRequests, CONFIG.totalRequests - i);
      const promises = [];
      
      for (let j = 0; j < batchSize; j++) {
        const endpoint = this.selectEndpoint();
        promises.push(this.makeRequest(endpoint));
      }
      
      await Promise.all(promises);
      
      // Delay between batches
      if (i + CONFIG.concurrentRequests < CONFIG.totalRequests) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
      }
      
      // Progress indicator
      const progress = Math.round(((i + batchSize) / CONFIG.totalRequests) * 100);
      process.stdout.write(`\r📈 Progress: ${progress}% (${i + batchSize}/${CONFIG.totalRequests})`);
    }
    
    const totalDuration = Date.now() - startTime;
    
    console.log('\n');
    console.log('📊 Simulation Complete!');
    console.log('='.repeat(50));
    this.printStats(totalDuration);
  }

  printStats(totalDuration) {
    const avgResponseTime = this.stats.totalTime / this.stats.total;
    const successRate = (this.stats.success / this.stats.total) * 100;
    const requestsPerSecond = (this.stats.total / totalDuration) * 1000;
    
    console.log(`📈 Total Requests: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.success} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🚀 Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`⏰ Total Duration: ${totalDuration}ms`);
    
    // Endpoint breakdown
    console.log('\n📊 Endpoint Breakdown:');
    const endpointStats = {};
    
    this.stats.responses.forEach(response => {
      if (!endpointStats[response.endpoint]) {
        endpointStats[response.endpoint] = {
          count: 0,
          success: 0,
          totalTime: 0
        };
      }
      
      endpointStats[response.endpoint].count++;
      endpointStats[response.endpoint].totalTime += response.duration;
      
      if (response.success) {
        endpointStats[response.endpoint].success++;
      }
    });
    
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      const avgTime = stats.totalTime / stats.count;
      const successRate = (stats.success / stats.count) * 100;
      console.log(`   ${endpoint}: ${stats.count} requests, ${successRate.toFixed(1)}% success, ${avgTime.toFixed(2)}ms avg`);
    });
  }
}

// Command line argument parsing
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 API Load Simulator

Usage: node simulate-requests.js [options]

Options:
  --requests <number>    Total number of requests (default: 100)
  --delay <ms>          Delay between request batches (default: 100ms)
  --concurrent <number> Concurrent requests per batch (default: 5)
  --quiet               Suppress verbose output
  --help, -h            Show this help message

Examples:
  node simulate-requests.js --requests 50 --delay 200
  node simulate-requests.js --concurrent 10 --quiet
  node simulate-requests.js --requests 1000 --delay 50 --concurrent 20
`);
  process.exit(0);
}

// Parse command line arguments
if (args.includes('--requests')) {
  const index = args.indexOf('--requests');
  CONFIG.totalRequests = parseInt(args[index + 1]) || 100;
}

if (args.includes('--delay')) {
  const index = args.indexOf('--delay');
  CONFIG.delayBetweenRequests = parseInt(args[index + 1]) || 100;
}

if (args.includes('--concurrent')) {
  const index = args.indexOf('--concurrent');
  CONFIG.concurrentRequests = parseInt(args[index + 1]) || 5;
}

if (args.includes('--quiet')) {
  CONFIG.verbose = false;
}

// Run the simulation
const simulator = new RequestSimulator();
simulator.runSimulation().catch(console.error);
