import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [queueStats, setQueueStats] = useState({ pendingCount: 0, reviewCount: 0, totalToday: 0 });

  // Connect to socket server
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('No auth token, skipping socket connection');
      return;
    }

    setConnectionStatus('connecting');

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('✓ Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Request initial data
      newSocket.emit('request:queue-stats');
      newSocket.emit('request:unread');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('✗ Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnectionStatus('disconnected');
    });

    // Handle notifications
    newSocket.on('notification', (notification) => {
      console.log('📬 New notification:', notification);
      setNotifications((prev) => [notification, ...prev].slice(0, 100));
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.type,
        });
      }
    });

    // Handle queue updates
    newSocket.on('queue:update', (stats) => {
      console.log('📊 Queue update:', stats);
      setQueueStats(stats);
    });

    // Handle unread notifications response
    newSocket.on('unread:notifications', ({ notifications: unreadNotifs, unreadCount: count }) => {
      console.log('📬 Unread notifications:', count);
      setNotifications(unreadNotifs);
      setUnreadCount(count);
    });

    // Handle notifications cleared
    newSocket.on('notifications:cleared', ({ count }) => {
      console.log('✓ Cleared', count, 'notifications');
      setUnreadCount(0);
      setNotifications([]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    if (socket) {
      socket.emit('notification:read', { notificationId });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, [socket]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (socket) {
      socket.emit('notifications:read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    }
  }, [socket]);

  // Join a room
  const joinRoom = useCallback((roomName) => {
    if (socket) {
      socket.emit('join:room', roomName);
    }
  }, [socket]);

  // Leave a room
  const leaveRoom = useCallback((roomName) => {
    if (socket) {
      socket.emit('leave:room', roomName);
    }
  }, [socket]);

  // Refresh queue stats
  const refreshQueueStats = useCallback(() => {
    if (socket) {
      socket.emit('request:queue-stats');
    }
  }, [socket]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    notifications,
    unreadCount,
    queueStats,
    markAsRead,
    markAllAsRead,
    joinRoom,
    leaveRoom,
    refreshQueueStats,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
