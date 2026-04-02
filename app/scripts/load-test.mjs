/**
 * load-test.mjs
 *
 * Simulates N participants subscribing to a Supabase Broadcast channel
 * and measures message delivery latency end-to-end.
 *
 * Usage:
 *   node scripts/load-test.mjs
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js   (or use your existing install)
 *
 * Set your Supabase URL and anon key below (or via env vars).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Read .env file automatically (supports .env and .env.local) ───────────────
const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const candidates = [
    resolve(__dir, '../.env.local'),
    resolve(__dir, '../.env'),
  ];
  const env = {};
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
    break; // stop after first found file
  }
  return env;
}

const env = loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = env.VITE_SUPABASE_URL      || env.SUPABASE_URL      || '';
const SUPABASE_ANON     = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
const PARTICIPANT_COUNT = 100;   // number of simulated clients
const MESSAGE_COUNT     = 5;     // number of broadcast messages to send
const MESSAGE_DELAY_MS  = 2000;  // pause between messages (ms)
const TEST_SESSION_ID   = 'load-test-' + Date.now();
const BROADCAST_EVENT   = 'session-event';
const CHANNEL_NAME      = `session-broadcast-${TEST_SESSION_ID}`;
// ─────────────────────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('\n❌  Could not find Supabase credentials.');
  console.error('    Make sure your project has a .env or .env.local file with:');
  console.error('      VITE_SUPABASE_URL=https://xxxx.supabase.co');
  console.error('      VITE_SUPABASE_ANON_KEY=eyJ...\n');
  process.exit(1);
}

// Each simulated participant gets its own Supabase client (own WS connection)
function createParticipant(id) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  return new Promise((resolve) => {
    const received = [];
    let subscribed = false;

    const channel = client
      .channel(CHANNEL_NAME, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
        const now = Date.now();
        const latency = now - payload.sentAt;
        received.push({ msgId: payload.msgId, latency });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !subscribed) {
          subscribed = true;
          resolve({ id, channel, client, received });
        }
      });
  });
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printStats(label, latencies) {
  if (latencies.length === 0) {
    console.log(`  ${label}: no data`);
    return;
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length);
  console.log(
    `  ${label.padEnd(8)} | min: ${sorted[0]}ms  avg: ${avg}ms  p50: ${percentile(sorted, 50)}ms  p95: ${percentile(sorted, 95)}ms  p99: ${percentile(sorted, 99)}ms  max: ${sorted[sorted.length - 1]}ms  (n=${sorted.length})`
  );
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n🚀  Load test starting`);
  console.log(`    Supabase project : ${SUPABASE_URL}`);
  console.log(`    Participants      : ${PARTICIPANT_COUNT}`);
  console.log(`    Messages          : ${MESSAGE_COUNT}`);
  console.log(`    Channel           : ${CHANNEL_NAME}\n`);

  // ── Step 1: connect all participants ──────────────────────────────────────
  console.log(`⏳  Connecting ${PARTICIPANT_COUNT} participants...`);
  const connectStart = Date.now();

  const participants = await Promise.all(
    Array.from({ length: PARTICIPANT_COUNT }, (_, i) => createParticipant(i))
  );

  const connectMs = Date.now() - connectStart;
  console.log(`✅  All connected in ${connectMs}ms\n`);

  // ── Step 2: create a host client to broadcast messages ────────────────────
  const hostClient = createClient(SUPABASE_URL, SUPABASE_ANON);
  const hostChannel = hostClient.channel(CHANNEL_NAME, {
    config: { broadcast: { self: false } },
  });

  await new Promise((res) => hostChannel.subscribe((s) => s === 'SUBSCRIBED' && res()));

  // ── Step 3: send messages, measure per-message latency ────────────────────
  const allLatencies = [];
  const perMessageLatencies = [];

  for (let msg = 0; msg < MESSAGE_COUNT; msg++) {
    const msgId = msg;
    const sentAt = Date.now();

    hostChannel.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'QUESTION_CHANGE', msgId, sentAt },
    });

    console.log(`📤  Sent message ${msg + 1}/${MESSAGE_COUNT} at ${new Date(sentAt).toISOString()}`);

    // Wait for all participants to receive it (with a 5s timeout per message)
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const received = participants.filter((p) =>
        p.received.some((r) => r.msgId === msgId)
      ).length;
      if (received === PARTICIPANT_COUNT) break;
      await sleep(50);
    }

    const msgLatencies = participants
      .flatMap((p) => p.received.filter((r) => r.msgId === msgId).map((r) => r.latency));

    const received = msgLatencies.length;
    const missing  = PARTICIPANT_COUNT - received;

    console.log(`    Delivered: ${received}/${PARTICIPANT_COUNT} participants${missing > 0 ? ` (⚠️  ${missing} missed)` : ''}`);
    printStats(`msg ${msg + 1}`, msgLatencies);
    perMessageLatencies.push(msgLatencies);
    allLatencies.push(...msgLatencies);

    if (msg < MESSAGE_COUNT - 1) await sleep(MESSAGE_DELAY_MS);
  }

  // ── Step 4: overall summary ───────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊  OVERALL RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  printStats('all', allLatencies);

  const totalExpected = PARTICIPANT_COUNT * MESSAGE_COUNT;
  const totalReceived = allLatencies.length;
  const deliveryRate  = ((totalReceived / totalExpected) * 100).toFixed(1);
  console.log(`\n    Delivery rate: ${deliveryRate}% (${totalReceived}/${totalExpected} messages)`);

  // ── Step 5: latency distribution buckets ─────────────────────────────────
  const buckets = [
    { label: '< 50ms',    fn: (v) => v < 50 },
    { label: '50–100ms',  fn: (v) => v >= 50  && v < 100 },
    { label: '100–200ms', fn: (v) => v >= 100 && v < 200 },
    { label: '200–500ms', fn: (v) => v >= 200 && v < 500 },
    { label: '> 500ms',   fn: (v) => v >= 500 },
  ];

  console.log('\n    Latency distribution:');
  for (const { label, fn } of buckets) {
    const count = allLatencies.filter(fn).length;
    const pct   = totalReceived > 0 ? ((count / totalReceived) * 100).toFixed(1) : '0.0';
    const bar   = '█'.repeat(Math.round(count / totalReceived * 30) || 0);
    console.log(`      ${label.padEnd(12)} ${String(count).padStart(5)} (${String(pct).padStart(5)}%)  ${bar}`);
  }

  console.log('\n✅  Test complete. Cleaning up...\n');

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await Promise.all(participants.map((p) => p.client.removeAllChannels()));
  await hostClient.removeAllChannels();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
