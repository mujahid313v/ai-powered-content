# Complete Testing Guide

## Step 1: Setup (One Time)

### Backend Setup
```bash
npm install
npm run migrate
```

### Create Admin Account
```bash
npm run create-admin admin@test.com admin123 "Test Admin"
```

### Start Backend
```bash
npm run dev
```

### Frontend Setup (New Terminal)
```bash
cd client
npm install
npm start
```

## Step 2: Test User Registration & Login

### Register as Regular User
1. Go to `http://localhost:3001`
2. Click "Register here"
3. Fill form:
   - Full Name: "John User"
   - Email: "john@test.com"
   - Password: "user123"
4. Click "Register"
5. You'll be logged in automatically

### Test User Features
1. **Submit Content**:
   - Type: Text
   - Content: "This is my first post"
   - Click "Submit for Review"
   
2. **View Submissions**:
   - Click "My Submissions" tab
   - See your content with status "pending" or "under_review"

3. **Logout**:
   - Click "🚪 Logout" button (top-right)

## Step 3: Test Admin/Moderator Features

### Login as Admin
1. Click "Login here" if on register page
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Click "Login"

### Switch to Admin Dashboard
1. Click "🛡️ Admin Dashboard" button (top-right)

### Review Content
1. Go to "Review Queue" tab
2. See John's submitted content
3. Click "✓ Approve" or "✗ Reject"
4. If rejecting, enter reason: "Inappropriate content"

### View Analytics
1. Go to "Dashboard" tab
2. See stats:
   - Pending: X
   - Approved: X
   - Rejected: X

## Step 4: Test Appeal System

### As User (John)
1. Logout from admin
2. Login as john@test.com / user123
3. Go to "My Submissions"
4. If content was rejected, click "📝 Appeal This Decision"
5. Enter reason: "This content is appropriate, please review again"
6. Click "Submit Appeal"

### As Admin
1. Logout
2. Login as admin@test.com / admin123
3. Switch to Admin Dashboard
4. Go to "Appeals" tab
5. See John's appeal
6. Click "Approve Appeal" or "Deny Appeal"
7. Enter resolution notes

## Step 5: Test Security Features

### Test Role-Based Access
1. Login as regular user (john@test.com)
2. Notice: No "Admin Dashboard" button visible
3. User cannot access admin features

### Test Soft Delete
1. Login as any user
2. Go to browser console (F12)
3. Run:
```javascript
fetch('http://localhost:3000/api/auth/account', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)
```
4. Account is soft-deleted (not removed from database)
5. Try to login again - should fail

## Test Accounts Summary

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@test.com | admin123 | moderator | Admin testing |
| john@test.com | user123 | user | User testing |

## Expected Behaviors

### ✅ Security
- Users cannot register as admin/moderator
- Only moderators see admin dashboard button
- Deleted accounts cannot login
- JWT tokens expire after 7 days

### ✅ Content Flow
1. User submits → Status: "pending"
2. AI analyzes → Status: "under_review" or auto-approved
3. Admin reviews → Status: "approved" or "rejected"
4. User appeals → Back to review queue
5. Admin resolves → Final decision

### ✅ UI/UX
- 3D effects on hover (user portal)
- Smooth animations
- Real-time stat updates
- Responsive design

## Troubleshooting

**Cannot create admin:**
- Stop backend server first (Ctrl+C)
- Run create-admin command
- Restart backend

**Login fails:**
- Check email/password spelling
- Ensure account not soft-deleted
- Check backend terminal for errors

**Admin button not showing:**
- Logout and login again
- Check user role in database
- Clear browser cache

## Production Checklist

Before deploying:
- [ ] Change JWT_SECRET in .env
- [ ] Change default admin password
- [ ] Remove or secure create-admin script
- [ ] Enable HTTPS
- [ ] Set up proper database backups
- [ ] Configure rate limiting
- [ ] Add logging and monitoring
- [ ] Review ADMIN_SETUP.md
