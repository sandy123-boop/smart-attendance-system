const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Class = require('./models/Class');

let io = null;

function getIO() {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}

function init(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('auth required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).lean();
      if (!user) return next(new Error('invalid token'));
      socket.user = user;
      next();
    } catch {
      next(new Error('auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;

    let classes;
    if (user.role === 'teacher') {
      classes = await Class.find({ teacher: user._id }).select('_id').lean();
    } else {
      classes = await Class.find({ students: user._id }).select('_id').lean();
    }
    for (const c of classes) {
      socket.join(`class:${c._id}`);
    }

    socket.on('disconnect', () => {});
  });

  return io;
}

module.exports = { init, getIO };
