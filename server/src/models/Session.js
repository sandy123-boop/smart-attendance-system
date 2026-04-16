const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    durationMin: { type: Number, required: true, min: 1 },
    endTime: { type: Date, required: true },
    qrSecret: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
      index: true,
    },
  },
  { timestamps: true }
);

sessionSchema.methods.isLive = function (now = new Date()) {
  if (this.status === 'ended') return false;
  return now >= this.startTime && now <= this.endTime;
};

module.exports = mongoose.model('Session', sessionSchema);
