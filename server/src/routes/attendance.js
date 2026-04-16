const express = require('express');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Class = require('../models/Class');
const { authRequired, requireRole } = require('../middleware/auth');
const { verifyToken } = require('../utils/qrToken');
const { getIO } = require('../socket');

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.post('/mark', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }

    const sessionId = token.split('.')[0];
    if (!isValidId(sessionId)) {
      return res.status(400).json({ error: 'Invalid QR token' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const now = new Date();
    if (session.status === 'ended' || now > session.endTime) {
      return res.status(400).json({ error: 'Session has ended' });
    }
    if (now < session.startTime) {
      return res.status(400).json({ error: 'Session has not started yet' });
    }

    const ok = verifyToken(token, session._id, session.qrSecret, now.getTime());
    if (!ok) {
      return res.status(400).json({ error: 'Invalid or expired QR token' });
    }

    const klass = await Class.findById(session.class).select('students');
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.students.some((s) => s.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not enrolled in this class' });
    }

    const existing = await Attendance.findOne({
      session: session._id,
      student: req.user._id,
    });
    if (existing) {
      return res.status(409).json({
        error: 'Attendance already marked',
        attendance: existing,
      });
    }

    const doc = await Attendance.create({
      session: session._id,
      class: session.class,
      student: req.user._id,
      status: 'present',
      scannedAt: now,
    });

    try {
      getIO().to(`class:${session.class}`).emit('attendance:marked', {
        sessionId: String(session._id),
        student: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          rollNo: req.user.rollNo || '',
        },
        status: 'present',
        scannedAt: doc.scannedAt,
      });
    } catch {}

    res.status(201).json({
      attendance: doc,
      session: {
        id: session._id,
        title: session.title,
        endTime: session.endTime,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Attendance already marked' });
    }
    console.error('[attendance mark]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student: my status for a session
router.get('/session/:id/me', authRequired, requireRole('student'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const record = await Attendance.findOne({
      session: req.params.id,
      student: req.user._id,
    });
    res.json({ attendance: record || null });
  } catch (err) {
    console.error('[attendance me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Teacher: full roster + attendance for a session
router.get('/session/:id', authRequired, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const klass = await Class.findById(session.class).populate(
      'students',
      'name email rollNo'
    );
    if (!klass) return res.status(404).json({ error: 'Class not found' });

    const isTeacher = session.teacher.equals(req.user._id);
    const isStudent = klass.students.some((s) => s._id.equals(req.user._id));
    if (!isTeacher && !isStudent) return res.status(403).json({ error: 'Forbidden' });

    const records = await Attendance.find({ session: session._id }).lean();
    const byStudent = new Map(records.map((r) => [String(r.student), r]));

    const roster = klass.students.map((s) => {
      const r = byStudent.get(String(s._id));
      return {
        student: { _id: s._id, name: s.name, email: s.email, rollNo: s.rollNo },
        status: r ? r.status : null,
        scannedAt: r ? r.scannedAt : null,
      };
    });

    roster.sort((a, b) => {
      const rank = (v) => (v === 'present' ? 0 : v === 'absent' ? 2 : 1);
      return rank(a.status) - rank(b.status);
    });

    res.json({
      sessionId: session._id,
      total: klass.students.length,
      present: roster.filter((r) => r.status === 'present').length,
      absent: roster.filter((r) => r.status === 'absent').length,
      pending: roster.filter((r) => r.status === null).length,
      roster,
    });
  } catch (err) {
    console.error('[attendance session]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student: attendance overview across all classes
router.get('/me', authRequired, requireRole('student'), async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user._id })
      .select('name code')
      .lean();

    const classIds = classes.map((c) => c._id);
    const records = await Attendance.find({
      student: req.user._id,
      class: { $in: classIds },
    })
      .populate('session', 'title startTime durationMin status')
      .sort({ createdAt: -1 })
      .lean();

    const byClass = {};
    for (const c of classes) {
      byClass[String(c._id)] = {
        class: c,
        total: 0,
        present: 0,
        absent: 0,
        percentage: 0,
        records: [],
      };
    }

    for (const r of records) {
      const cid = String(r.class);
      if (!byClass[cid]) continue;
      byClass[cid].total++;
      if (r.status === 'present') byClass[cid].present++;
      else byClass[cid].absent++;
      byClass[cid].records.push({
        _id: r._id,
        session: r.session,
        status: r.status,
        scannedAt: r.scannedAt,
      });
    }

    for (const entry of Object.values(byClass)) {
      entry.percentage = entry.total > 0
        ? Math.round((entry.present / entry.total) * 100)
        : 0;
    }

    const overall = { total: 0, present: 0, absent: 0 };
    for (const entry of Object.values(byClass)) {
      overall.total += entry.total;
      overall.present += entry.present;
      overall.absent += entry.absent;
    }
    overall.percentage = overall.total > 0
      ? Math.round((overall.present / overall.total) * 100)
      : 0;

    res.json({
      overall,
      classes: Object.values(byClass),
    });
  } catch (err) {
    console.error('[attendance/me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student: attendance for a specific class (detailed)
router.get('/me/:classId', authRequired, requireRole('student'), async (req, res) => {
  try {
    if (!isValidId(req.params.classId)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.classId).select('name code');
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.students?.includes(req.user._id)) {
      const full = await Class.findById(req.params.classId).select('students');
      if (!full.students.some((s) => s.equals(req.user._id))) {
        return res.status(403).json({ error: 'Not enrolled' });
      }
    }

    const records = await Attendance.find({
      student: req.user._id,
      class: klass._id,
    })
      .populate('session', 'title startTime durationMin status endTime')
      .sort({ createdAt: -1 })
      .lean();

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      class: klass,
      total,
      present,
      absent,
      percentage,
      records: records.map((r) => ({
        _id: r._id,
        session: r.session,
        status: r.status,
        scannedAt: r.scannedAt,
      })),
    });
  } catch (err) {
    console.error('[attendance/me/:classId]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
