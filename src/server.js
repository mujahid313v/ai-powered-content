require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const appealRoutes = require('./routes/appeals');
const analyticsRoutes = require('./routes/analytics');
const notificationService = require('./services/notificationService');
const { socketAuth } = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize notification service
notificationService.initialize(io);

// Socket.io authentication middleware
io.use(socketAuth);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

  // Register user socket for targeted notifications
  if (socket.userId) {
    notificationService.registerSocket(socket.userId, socket.id);

    // Join role-based rooms
    if (socket.userRole === 'moderator' || socket.userRole === 'admin') {
      socket.join('moderators');
      console.log(`User ${socket.userId} joined moderators room`);
    }
  }

  // Handle client joining specific rooms
  socket.on('join:room', (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.userId} joined room: ${roomName}`);
  });

  // Handle client leaving rooms
  socket.on('leave:room', (roomName) => {
    socket.leave(roomName);
    console.log(`User ${socket.userId} left room: ${roomName}`);
  });

  // Request queue stats
  socket.on('request:queue-stats', async () => {
    const stats = await notificationService.getQueueStats();
    socket.emit('queue:update', stats);
  });

  // Request unread notifications
  socket.on('request:unread', async () => {
    if (socket.userId) {
      const notifications = await notificationService.getUnreadNotifications(socket.userId);
      const unreadCount = await notificationService.getUnreadCount(socket.userId);
      socket.emit('unread:notifications', { notifications, unreadCount });
    }
  });

  // Mark notification as read
  socket.on('notification:read', async (data) => {
    if (socket.userId && data.notificationId) {
      await notificationService.markAsRead(data.notificationId, socket.userId);
    }
  });

  // Mark all notifications as read
  socket.on('notifications:read-all', async () => {
    if (socket.userId) {
      const count = await notificationService.markAllAsRead(socket.userId);
      socket.emit('notifications:cleared', { count });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`✗ Client disconnected: ${socket.id} (Reason: ${reason})`);
    if (socket.userId) {
      notificationService.unregisterSocket(socket.userId, socket.id);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error.message);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check with socket info
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sockets: {
      connected: io.engine?.clientsCount || 0
    }
  });
});

// Notification routes
app.get('/api/notifications', async (req, res) => {
  // Require authentication (would be added via auth middleware)
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const notifications = await notificationService.getRecentNotifications(userId, 50);
  res.json({ notifications });
});

app.get('/api/notifications/unread-count', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const unreadCount = await notificationService.getUnreadCount(userId);
  res.json({ unreadCount });
});

// Start server
server.listen(PORT, () => {
  console.log(`Content Moderation Platform running on port ${PORT}`);
  console.log(`Socket.io ready for real-time notifications`);
});

module.exports = { app, server, io };
