/*
 * Manual smoke test for Email OTP endpoints.
 *
 * Usage:
 *   cd backend
 *   node scripts/testEmailOTP.js you@example.com
 */

const readline = require('readline');

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api/auth';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  const email = (process.argv[2] || '').trim();

  if (!email) {
    console.error('❌ Please provide an email: node scripts/testEmailOTP.js you@example.com');
    process.exit(1);
  }

  console.log(`\n➡️  Sending OTP to ${email} ...`);
  const sendRes = await post('/send-email-otp', { email, purpose: 'login' });
  console.log('Status:', sendRes.status);
  console.log('Response:', sendRes.data);

  if (!sendRes.ok) {
    process.exit(1);
  }

  const otp = (await ask('\nEnter the OTP you received by email: ')).trim();

  console.log('\n➡️  Verifying OTP ...');
  const verifyRes = await post('/verify-email-otp', { email, otp });
  console.log('Status:', verifyRes.status);
  console.log('Response:', verifyRes.data);

  if (!verifyRes.ok) {
    process.exit(1);
  }

  console.log('\n✅ Email OTP flow looks good.');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
