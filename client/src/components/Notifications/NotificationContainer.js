import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import NotificationToast from './NotificationToast';
import './notifications.css';

const NotificationContainer = () => {
  const { notifications } = useSocket();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((notification) => {
    const id = notification.id || Date.now();
    setToasts((prev) => [...prev, { ...notification, _id: id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t._id !== id));
  }, []);

  // Add toast when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      // Only add toast if it's a new one (not already in toasts)
      const exists = toasts.some((t) => t.id === latestNotification.id);
      if (!exists) {
        addToast(latestNotification);
      }
    }
  }, [notifications, addToast, toasts]);

  return (
    <div className="notification-toast-container">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast._id}
          notification={toast}
          onClose={() => removeToast(toast._id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
