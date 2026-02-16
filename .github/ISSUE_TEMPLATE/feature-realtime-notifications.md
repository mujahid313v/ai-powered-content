# Feature Request: Real-time Notifications System

## 📋 Overview
Implement a real-time notification system using WebSocket (Socket.io) to alert moderators of important events and provide live updates to the admin dashboard.

## 🎯 Problem Statement
Currently, moderators have no way of knowing when:
- New high-priority content is submitted
- Content in the review queue is updated
- An appeal is resolved
- The queue count changes

Moderators must manually refresh the dashboard to see updates, leading to delayed responses and inefficient workflows.

## ✨ Proposed Solution
Integrate Socket.io to enable real-time bidirectional communication between the server and admin dashboard clients.

### Key Features
- [ ] **Live Queue Count** - Update review queue badge in real-time
- [ ] **New Content Alerts** - Notify when high-priority content arrives
- [ ] **Appeal Notifications** - Alert when appeals are submitted/resolved
- [ ] **Moderation Updates** - Show when other moderators approve/reject content
- [ ] **Connection Status** - Display WebSocket connection state in UI
- [ ] **Toast Notifications** - Non-intrusive popup alerts for events

## 🏗️ Technical Implementation

### Backend Changes
```
src/
├── server.js              # Add Socket.io server setup
├── services/
│   ├── notificationService.js  # NEW: Notification logic
│   └── queueService.js    # Emit events on job completion
└── middleware/
    └── socketAuth.js      # NEW: Socket authentication
```

### Frontend Changes
```
client/src/
├── components/
│   ├── Notifications/
│   │   ├── NotificationToast.js   # NEW: Toast component
│   │   ├── NotificationBell.js    # NEW: Bell with unread count
│   │   └── notifications.css      # NEW: Styles
│   └── Dashboard.js         # Add live queue count
├── context/
│   └── SocketContext.js       # NEW: Socket.io context
└── App.js                 # Wrap with SocketProvider
```

### Dependencies to Add
```json
// Backend
"socket.io": "^4.6.0"

// Frontend
"socket.io-client": "^4.6.0",
"react-hot-toast": "^2.4.0"
```

## 📡 Event Types

| Event | Direction | Payload |
|-------|-----------|---------|
| `connect` | Client → Server | `{ authToken }` |
| `disconnect` | Client → Server | - |
| `notification` | Server → Client | `{ type, title, message, timestamp, priority }` |
| `queue:update` | Server → Client | `{ queueCount, pendingCount, reviewCount }` |
| `content:submitted` | Server → Client | `{ contentId, contentType, priority, submitterId }` |
| `appeal:submitted` | Server → Client | `{ appealId, contentId, reason }` |
| `moderation:completed` | Server → Client | `{ contentId, decision, moderatorId }` |

## 🎨 UI/UX Requirements

### Notification Bell
- Located in top-right corner of dashboard
- Shows unread count badge
- Dropdown with recent notifications (last 24h)
- Mark as read/unread functionality
- Clear all button

### Toast Notifications
- Auto-dismiss after 5 seconds
- Priority-based colors:
  - 🔴 High (urgent content)
  - 🟡 Medium (new appeal)
  - 🟢 Low (queue update)
- Click to navigate to related page
- Pause on hover

### Connection Status
- Small indicator near bell icon
- 🟢 Connected
- 🟡 Reconnecting
- 🔴 Disconnected

## 🔐 Security Considerations
- [ ] Authenticate WebSocket connections with JWT token
- [ ] Rate limit notification events per client
- [ ] Validate all incoming socket events
- [ ] Implement authorization for sensitive notifications
- [ ] Add CORS configuration for Socket.io

## 📊 Database Changes
New table for notification history:
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  priority TEXT DEFAULT 'medium',
  is_read INTEGER DEFAULT 0,
  related_content_id INTEGER,
  related_appeal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## ✅ Acceptance Criteria

### Backend
- [ ] Socket.io server integrated with Express
- [ ] Authentication middleware for WebSocket connections
- [ ] Events emitted on content submission
- [ ] Events emitted on moderation completion
- [ ] Events emitted on appeal status change
- [ ] Queue count broadcast on any queue change
- [ ] Notification persistence in database
- [ ] Graceful handling of disconnections

### Frontend
- [ ] Socket.io client connected on dashboard mount
- [ ] Notification bell component with unread count
- [ ] Toast notifications for all event types
- [ ] Connection status indicator
- [ ] Notifications stored in local state
- [ ] Mark notification as read on click
- [ ] Reconnection logic with exponential backoff
- [ ] Clean up socket connections on unmount

## 🧪 Testing Checklist
- [ ] Test notification delivery with multiple connected clients
- [ ] Test reconnection after network interruption
- [ ] Test authentication failure scenarios
- [ ] Test high-frequency event handling (100+ events/min)
- [ ] Test notification persistence after page refresh
- [ ] Test mobile responsiveness of notification UI

## 📈 Performance Requirements
- Notification delivery latency < 200ms
- Support 50+ concurrent moderator connections
- Auto-cleanup of notifications older than 7 days
- Max 100 notifications stored per user

## 🚀 Rollout Plan
1. **Phase 1**: Backend Socket.io setup + basic events
2. **Phase 2**: Frontend socket client + connection handling
3. **Phase 3**: Notification bell + toast UI components
4. **Phase 4**: Database persistence + notification history
5. **Phase 5**: Testing + performance optimization

## 🔗 Related Issues
- #XX - Admin Dashboard Improvements
- #XX - Appeal System Enhancement
- #XX - Moderator Performance Tracking

## 📝 Additional Notes
- Consider using Redis adapter for horizontal scaling in production
- Add environment variable to disable notifications if needed
- Document Socket.io events in API documentation

---

**Estimated Effort**: 2-3 days  
**Priority**: High  
**Assignee**: [TBD]
