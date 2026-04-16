const express = require('express');
const User = require('../models/User');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.get('/students', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    const filter = { role: 'student' };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { rollNo: rx }];
    }
    const students = await User.find(filter)
      .select('name email rollNo department')
      .limit(50)
      .lean();
    res.json({ students });
  } catch (err) {
    console.error('[users/students]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', authRequired, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'department', 'rollNo', 'avatarUrl'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    }

    if (updates.name !== undefined && updates.name.length < 1) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }

    if (req.user.role === 'student' && updates.department !== undefined) {
      delete updates.department;
    }
    if (req.user.role === 'teacher' && updates.rollNo !== undefined) {
      delete updates.rollNo;
    }

    Object.assign(req.user, updates);
    await req.user.save();

    res.json({ user: req.user.toPublic() });
  } catch (err) {
    console.error('[users/me PUT]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
