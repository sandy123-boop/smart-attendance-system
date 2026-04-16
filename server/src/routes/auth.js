const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role are required' });
    }
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'role must be teacher or student' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const user = new User({ name: name.trim(), email: email.toLowerCase(), role });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user);
    res.status(201).json({ user: user.toPublic(), token });
  } catch (err) {
    console.error('[auth/signup]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ user: user.toPublic(), token });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });

    // Always respond 200 to avoid email enumeration
    const genericResponse = {
      ok: true,
      message: 'If an account exists for this email, a reset link has been sent.',
    };

    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${rawToken}`;

    const { previewUrl } = await sendMail({
      to: user.email,
      subject: 'Reset your Smart Attendance password',
      text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#0f172a;">Reset your password</h2>
          <p style="color:#475569;">We received a request to reset your Smart Attendance password.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset password
            </a>
          </p>
          <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;">Or copy: ${resetLink}</p>
        </div>
      `,
    });

    const response = { ...genericResponse };
    if (previewUrl) response.previewUrl = previewUrl; // dev-only
    res.json(response);
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body || {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await user.setPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ ok: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
