import React, { useEffect, useState } from 'react';
import './notifications.css';

const NotificationToast = ({ notification, onClose, onClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const priorityConfig = {
    high: { color: '#dc3545', icon: '🔴' },
    medium: { color: '#ffc107', icon: '🟡' },
    low: { color: '#28a745', icon: '🟢' },
  };

  const config = priorityConfig[notification.priority] || priorityConfig.medium;

  useEffect(() => {
    if (!isPaused) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isPaused, onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`notification-toast notification-toast-${notification.priority}`}
      style={{ borderLeftColor: config.color }}
      onClick={handleClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="notification-toast-header">
        <span className="notification-toast-icon">{config.icon}</span>
        <span className="notification-toast-title">{notification.title}</span>
        <button className="notification-toast-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ×
        </button>
      </div>
      <div className="notification-toast-message">{notification.message}</div>
      <div className="notification-toast-time">
        {new Date(notification.timestamp).toLocaleTimeString()}
      </div>
      {!isPaused && (
        <div className="notification-toast-progress">
          <div className="notification-toast-progress-bar" style={{ backgroundColor: config.color }} />
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
