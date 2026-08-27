require('dotenv').config();
const dns = require('dns').promises;
const net = require('net');
const { MongoClient } = require('mongodb');

const maskPassword = (uri) => uri.replace(/:([^@]+)@/, ':****@');

async function testDns(host) {
  try {
    const addresses = await dns.resolve4(host);
    console.log(`  DNS ${host}: ${addresses.join(', ')}`);
    return true;
  } catch (err) {
    console.log(`  DNS ${host}: FAILED - ${err.message}`);
    return false;
  }
}

function testTcp(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function testMongoClient(uri) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('  MongoDB driver: SUCCESS');
    const db = client.db();
    console.log('  Database name:', db.databaseName);
    await client.close();
    return true;
  } catch (err) {
    console.log('  MongoDB driver: FAILED');
    console.log(`    Error: ${err.name} - ${err.message}`);
    await client.close();
    return false;
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('=== MongoDB Connection Diagnostics ===');
  console.log('URI:', maskPassword(uri));
  console.log();

  // Extract hosts from URI
  const hosts = [
    'ac-8weuezd-shard-00-00.bwihsjp.mongodb.net',
    'ac-8weuezd-shard-00-01.bwihsjp.mongodb.net',
    'ac-8weuezd-shard-00-02.bwihsjp.mongodb.net',
  ];

  console.log('1. DNS Resolution:');
  let dnsOk = false;
  for (const host of hosts) {
    if (await testDns(host)) dnsOk = true;
  }
  console.log();

  console.log('2. TCP Connectivity (port 27017):');
  let tcpOk = false;
  for (const host of hosts) {
    const ok = await testTcp(host, 27017);
    console.log(`  TCP ${host}:27017 - ${ok ? 'OK' : 'FAILED'}`);
    if (ok) tcpOk = true;
  }
  console.log();

  console.log('3. MongoDB Driver Test:');
  const mongoOk = await testMongoClient(uri);
  console.log();

  console.log('=== Summary ===');
  console.log(`DNS:     ${dnsOk ? 'OK' : 'FAILED'}`);
  console.log(`TCP:     ${tcpOk ? 'OK' : 'FAILED'}`);
  console.log(`MongoDB: ${mongoOk ? 'OK' : 'FAILED'}`);
  console.log();

  if (!dnsOk) {
    console.log('DNS failed: Check your internet connection or DNS settings.');
  }
  if (!tcpOk) {
    console.log('TCP failed: Outbound port 27017 may be blocked by firewall/ISP.');
  }
  if (!mongoOk) {
    console.log('MongoDB failed: Check Atlas whitelist, credentials, and cluster status.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
