require('dotenv').config();
const http = require('http');
const os = require('os');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { init: initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const CLIENT_PORT = 5173;
const MONGO_URI = process.env.MONGO_URI;

function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const lanIP = getLanIP();
const allowedOrigins = [
  'http://localhost:' + CLIENT_PORT,
  'https://localhost:' + CLIENT_PORT,
  `http://${lanIP}:${CLIENT_PORT}`,
  `https://${lanIP}:${CLIENT_PORT}`,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'smart-attendance-server',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('[db] connected');
    } catch (err) {
      console.warn('[db] connection failed — continuing without DB:', err.message);
    }
  } else {
    console.warn('[db] MONGO_URI not set — skipping connection');
  }

  initSocket(server, allowedOrigins);
  console.log('[socket.io] initialised');

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log('  │                                              │');
    console.log(`  │  Server:  http://localhost:${PORT}            │`);
    console.log(`  │  LAN:     http://${lanIP}:${PORT}    │`);
    console.log('  │                                              │');
    console.log(`  │  Open on both laptop & phone:                │`);
    console.log(`  │  → https://${lanIP}:${CLIENT_PORT}   │`);
    console.log('  │                                              │');
    console.log('  └──────────────────────────────────────────────┘');
    console.log('');
  });
}

start();
