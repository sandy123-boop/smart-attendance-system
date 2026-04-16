const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Session = require('../models/Session');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const { authRequired, requireRole } = require('../middleware/auth');
const { createToken, ROTATION_MS } = require('../utils/qrToken');
const { getIO } = require('../socket');

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function deriveStatus(s, now = new Date()) {
  if (s.status === 'ended') return 'ended';
  if (now < s.startTime) return 'scheduled';
  if (now > s.endTime) return 'ended';
  return 'active';
}

async function canView(session, user) {
  if (session.teacher.equals(user._id)) return 'teacher';
  const klass = await Class.findById(session.class).select('students teacher');
  if (!klass) return null;
  if (klass.students.some((s) => s.equals(user._id))) return 'student';
  return null;
}

router.post('/', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    const { classId, title, startTime, durationMin } = req.body || {};
    if (!classId || !title || !durationMin) {
      return res.status(400).json({ error: 'classId, title, durationMin are required' });
    }
    if (!isValidId(classId)) return res.status(400).json({ error: 'Invalid classId' });

    const klass = await Class.findById(classId);
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const start = startTime ? new Date(startTime) : new Date();
    if (isNaN(start.getTime())) return res.status(400).json({ error: 'Invalid startTime' });
    const mins = Number(durationMin);
    if (!Number.isFinite(mins) || mins < 1 || mins > 480) {
      return res.status(400).json({ error: 'durationMin must be 1–480' });
    }
    const end = new Date(start.getTime() + mins * 60 * 1000);

    const doc = await Session.create({
      class: klass._id,
      teacher: req.user._id,
      title: String(title).trim(),
      startTime: start,
      durationMin: mins,
      endTime: end,
      qrSecret: crypto.randomBytes(32).toString('hex'),
      status: 'scheduled',
    });

    const obj = doc.toObject();
    delete obj.qrSecret;
    obj.status = deriveStatus(doc);

    try {
      getIO().to(`class:${klass._id}`).emit('session:created', {
        session: {
          _id: doc._id,
          title: doc.title,
          startTime: doc.startTime,
          durationMin: doc.durationMin,
          status: obj.status,
          class: { _id: klass._id, name: klass.name, code: klass.code },
        },
      });
    } catch {}

    res.status(201).json({ session: obj });
  } catch (err) {
    console.error('[sessions create]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authRequired, async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId || !isValidId(classId)) {
      return res.status(400).json({ error: 'classId is required' });
    }
    const klass = await Class.findById(classId);
    if (!klass) return res.status(404).json({ error: 'Class not found' });

    const isTeacher = klass.teacher.equals(req.user._id);
    const isStudent = klass.students.some((s) => s.equals(req.user._id));
    if (!isTeacher && !isStudent) return res.status(403).json({ error: 'Forbidden' });

    const sessions = await Session.find({ class: klass._id })
      .sort({ startTime: -1 })
      .select('-qrSecret')
      .lean();

    const now = new Date();
    for (const s of sessions) s.status = deriveStatus(s, now);

    res.json({ sessions });
  } catch (err) {
    console.error('[sessions list]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const session = await Session.findById(req.params.id)
      .populate('class', 'name code')
      .populate('teacher', 'name email');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const role = await canView(session, req.user);
    if (!role) return res.status(403).json({ error: 'Forbidden' });

    const obj = session.toObject();
    delete obj.qrSecret;
    obj.status = deriveStatus(session);
    res.json({ session: obj, viewerRole: role });
  } catch (err) {
    console.error('[sessions get]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/qr', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const status = deriveStatus(session);
    if (status === 'ended') {
      return res.status(400).json({ error: 'Session has ended' });
    }

    const token = createToken(session._id, session.qrSecret);
    const dataUrl = await QRCode.toDataURL(token, { margin: 1, width: 512 });

    res.json({
      token,
      dataUrl,
      rotationMs: ROTATION_MS,
      expiresAt: new Date(Date.now() + ROTATION_MS * 2).toISOString(),
      status,
    });
  } catch (err) {
    console.error('[sessions qr]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/end', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (session.status === 'ended') {
      return res.status(400).json({ error: 'Session already ended' });
    }

    session.status = 'ended';
    session.endTime = new Date();
    await session.save();

    // Auto-mark absent for enrolled students who didn't scan
    const klass = await Class.findById(session.class).select('students');
    if (klass) {
      const markedIds = await Attendance.find({ session: session._id })
        .select('student')
        .lean()
        .then((docs) => new Set(docs.map((d) => String(d.student))));

      const ops = klass.students
        .filter((sid) => !markedIds.has(String(sid)))
        .map((sid) => ({
          insertOne: {
            document: {
              session: session._id,
              class: session.class,
              student: sid,
              status: 'absent',
              scannedAt: null,
            },
          },
        }));

      if (ops.length > 0) {
        await Attendance.bulkWrite(ops, { ordered: false });
      }
    }

    // Fetch final summary
    const records = await Attendance.find({ session: session._id }).lean();
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;

    try {
      getIO().to(`class:${session.class}`).emit('session:ended', {
        sessionId: String(session._id),
        present,
        absent,
        total: present + absent,
      });
    } catch {}

    res.json({
      ok: true,
      session: {
        _id: session._id,
        status: 'ended',
        endTime: session.endTime,
      },
      summary: { present, absent, total: present + absent },
    });
  } catch (err) {
    console.error('[sessions end]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
