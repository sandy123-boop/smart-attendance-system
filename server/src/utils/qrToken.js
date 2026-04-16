const crypto = require('crypto');

const ROTATION_MS = 15 * 1000; // token rotates every 15s

function currentWindow(now = Date.now()) {
  return Math.floor(now / ROTATION_MS);
}

function sign(sessionId, secret, windowIdx) {
  const payload = `${sessionId}.${windowIdx}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${sessionId}.${windowIdx}.${sig}`;
}

function createToken(sessionId, secret) {
  return sign(String(sessionId), secret, currentWindow());
}

function verifyToken(token, sessionId, secret, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [sid, widxStr, sig] = parts;
  if (sid !== String(sessionId)) return false;
  const widx = Number(widxStr);
  if (!Number.isFinite(widx)) return false;

  const current = currentWindow(now);
  if (Math.abs(current - widx) > 1) return false; // allow ±1 window (~15s)

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${sid}.${widx}`)
    .digest('hex');

  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { createToken, verifyToken, ROTATION_MS };
