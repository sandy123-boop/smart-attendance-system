const express = require('express');
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', authRequired, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'teacher') {
      query = Class.find({ teacher: req.user._id });
    } else {
      query = Class.find({ students: req.user._id });
    }
    const classes = await query.sort({ createdAt: -1 }).lean();
    res.json({ classes });
  } catch (err) {
    console.error('[classes list]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    const { name, code, description } = req.body || {};
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }
    const doc = new Class({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      description: description ? String(description).trim() : '',
      teacher: req.user._id,
    });
    await doc.save();
    res.status(201).json({ class: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already have a class with this code' });
    }
    console.error('[classes create]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.id)
      .populate('teacher', 'name email department')
      .populate('students', 'name email rollNo');
    if (!klass) return res.status(404).json({ error: 'Class not found' });

    const isTeacher = klass.teacher._id.equals(req.user._id);
    const isStudent = klass.students.some((s) => s._id.equals(req.user._id));
    if (!isTeacher && !isStudent) return res.status(403).json({ error: 'Forbidden' });

    res.json({ class: klass });
  } catch (err) {
    console.error('[classes get]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, code, description } = req.body || {};
    if (name !== undefined) klass.name = String(name).trim();
    if (code !== undefined) klass.code = String(code).trim().toUpperCase();
    if (description !== undefined) klass.description = String(description).trim();

    await klass.save();
    res.json({ class: klass });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already have a class with this code' });
    }
    console.error('[classes update]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/assign', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid class id' });
    const { studentId } = req.body || {};
    if (!studentId || !isValidId(studentId)) {
      return res.status(400).json({ error: 'Valid studentId is required' });
    }

    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const User = require('../models/User');
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Student not found' });
    }

    if (klass.students.some((s) => s.equals(studentId))) {
      return res.status(409).json({ error: 'Student already in this class' });
    }

    klass.students.push(studentId);
    await klass.save();

    const populated = await klass.populate('students', 'name email rollNo');
    res.json({ class: populated });
  } catch (err) {
    console.error('[classes assign]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/assign/:studentId', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.studentId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    klass.students = klass.students.filter((s) => !s.equals(req.params.studentId));
    await klass.save();

    const populated = await klass.populate('students', 'name email rollNo');
    res.json({ class: populated });
  } catch (err) {
    console.error('[classes unassign]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await klass.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('[classes delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Teacher: attendance report for a class (per-student summaries, optional date filter)
router.get('/:id/attendance', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.id).populate(
      'students',
      'name email rollNo'
    );
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sessionFilter = { class: klass._id };
    const { from, to } = req.query;
    if (from || to) {
      sessionFilter.startTime = {};
      if (from) sessionFilter.startTime.$gte = new Date(from);
      if (to) sessionFilter.startTime.$lte = new Date(to);
    }

    const sessions = await Session.find(sessionFilter)
      .select('title startTime durationMin status endTime')
      .sort({ startTime: -1 })
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const records = await Attendance.find({
      session: { $in: sessionIds },
    }).lean();

    const byStudentSession = {};
    for (const r of records) {
      const key = `${r.student}_${r.session}`;
      byStudentSession[key] = r;
    }

    const studentSummaries = klass.students.map((s) => {
      let present = 0;
      let absent = 0;
      const sessionRecords = sessions.map((sess) => {
        const r = byStudentSession[`${s._id}_${sess._id}`];
        const status = r ? r.status : null;
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        return {
          sessionId: sess._id,
          title: sess.title,
          startTime: sess.startTime,
          status,
          scannedAt: r?.scannedAt || null,
        };
      });
      const total = present + absent;
      return {
        student: { _id: s._id, name: s.name, email: s.email, rollNo: s.rollNo },
        present,
        absent,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        sessions: sessionRecords,
      };
    });

    studentSummaries.sort((a, b) => a.student.name.localeCompare(b.student.name));

    const totalSessions = sessions.length;

    res.json({
      class: { _id: klass._id, name: klass.name, code: klass.code },
      totalSessions,
      studentCount: klass.students.length,
      sessions,
      students: studentSummaries,
    });
  } catch (err) {
    console.error('[classes attendance]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Teacher: CSV export
router.get('/:id/attendance/csv', authRequired, requireRole('teacher'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const klass = await Class.findById(req.params.id).populate(
      'students',
      'name email rollNo'
    );
    if (!klass) return res.status(404).json({ error: 'Class not found' });
    if (!klass.teacher.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sessionFilter = { class: klass._id };
    const { from, to } = req.query;
    if (from || to) {
      sessionFilter.startTime = {};
      if (from) sessionFilter.startTime.$gte = new Date(from);
      if (to) sessionFilter.startTime.$lte = new Date(to);
    }

    const sessions = await Session.find(sessionFilter)
      .select('title startTime')
      .sort({ startTime: 1 })
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const records = await Attendance.find({
      session: { $in: sessionIds },
    }).lean();

    const byKey = {};
    for (const r of records) {
      byKey[`${r.student}_${r.session}`] = r.status;
    }

    const escape = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = [
      'Name',
      'Email',
      'Roll No',
      ...sessions.map(
        (s) => `${s.title} (${new Date(s.startTime).toLocaleDateString()})`
      ),
      'Present',
      'Absent',
      'Total',
      '%',
    ];

    const rows = [headers.map(escape).join(',')];

    for (const stu of klass.students) {
      let present = 0;
      let absent = 0;
      const statuses = sessions.map((sess) => {
        const st = byKey[`${stu._id}_${sess._id}`] || '';
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        return st;
      });
      const total = present + absent;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      rows.push(
        [
          escape(stu.name),
          escape(stu.email),
          escape(stu.rollNo),
          ...statuses.map(escape),
          present,
          absent,
          total,
          `${pct}%`,
        ].join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${klass.code}_attendance.csv"`
    );
    res.send(rows.join('\n'));
  } catch (err) {
    console.error('[classes attendance csv]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
