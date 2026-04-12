/*
 * Manual smoke test for Phone OTP endpoints.
 *
 * Usage:
 *   cd backend
 *   node scripts/testPhoneOTP.js +8801234567890
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
  const phone = (process.argv[2] || '').trim();

  if (!phone) {
    console.error('❌ Please provide a phone: node scripts/testPhoneOTP.js +8801234567890');
    process.exit(1);
  }

  console.log(`\n➡️  Sending OTP to ${phone} ...`);
  const sendRes = await post('/send-otp', { phone });
  console.log('Status:', sendRes.status);
  console.log('Response:', sendRes.data);

  if (!sendRes.ok) {
    process.exit(1);
  }

  console.log('\nCheck the backend console output for the OTP (OTP_MODE=console).');
  const otp = (await ask('Enter the OTP: ')).trim();

  console.log('\n➡️  Verifying OTP ...');
  const verifyRes = await post('/verify-otp', { phone, otp });
  console.log('Status:', verifyRes.status);
  console.log('Response:', verifyRes.data);

  if (!verifyRes.ok) {
    process.exit(1);
  }

  console.log('\n✅ Phone OTP flow looks good.');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
