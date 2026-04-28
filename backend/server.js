const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting — generous general limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // enough headroom for active dev sessions
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Stricter limit specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 login/register attempts per 15 min
  message: 'Too many auth attempts, please try again later'
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/lawyers', require('./routes/lawyerRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', require('./routes/stripeRoutes'));




// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join personal room for private messaging
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle private messages
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('receiveMessage', data);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    io.to(data.receiverId).emit('userTyping', data);
  });

  socket.on('stopTyping', (data) => {
    io.to(data.receiverId).emit('userStopTyping', data);
  });

  // Video Call Signaling
  socket.on('joinVideoRoom', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined video room: ${room}`);
  });

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('incomingCall', {
      signal: data.signalData,
      from: data.from,
      name: data.name,
      appointmentId: data.appointmentId
    });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('iceCandidate', (data) => {
    io.to(data.to).emit('iceCandidate', data.candidate);
  });

  socket.on('endCall', (data) => {
    io.to(data.to).emit('endCall');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const cronService = require('./services/cronService');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  cronService.initCron(io);
});

// Triggering nodemon restart after .env updates for Razorpay
module.exports = { app, server, io };
