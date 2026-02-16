const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate Socket.io connections
 * Verifies JWT token from handshake auth
 */
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
};

/**
 * Middleware to require specific role for socket events
 */
const requireSocketRole = (...roles) => {
  return (socket, next) => {
    if (!socket.user || !roles.includes(socket.userRole)) {
      return next(new Error('Insufficient permissions'));
    }
    next();
  };
};

module.exports = { socketAuth, requireSocketRole };
