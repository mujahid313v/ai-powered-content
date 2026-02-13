# Admin/Moderator Setup Guide

## Security Notice

For security reasons, users CANNOT register as admin/moderator through the registration form. All new registrations are created as regular "user" role.

## Creating Admin/Moderator Accounts

### Method 1: Using Script (Recommended)

Run this command to create a moderator account:

```bash
npm run create-admin admin@example.com SecurePassword123 "Admin Name"
```

**Example:**
```bash
npm run create-admin john@company.com admin@2024 "John Doe"
```

This will:
- Create a new moderator account if email doesn't exist
- Promote existing user to moderator if email exists
- Display login credentials

### Method 2: Manual Database Update

If you want to promote an existing user to moderator:

1. Find the user ID:
```sql
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

2. Update their role:
```sql
UPDATE users SET role = 'moderator' WHERE id = 1;
```

## Default Admin Account

For testing, create a default admin:

```bash
npm run create-admin admin@test.com admin123 "Test Admin"
```

**Login with:**
- Email: `admin@test.com`
- Password: `admin123`

## Roles Explained

### User (Default)
- Can submit content
- Can view their submissions
- Can appeal rejected content
- Cannot access admin dashboard

### Moderator
- All user permissions
- Can access admin dashboard
- Can review content queue
- Can approve/reject content
- Can resolve appeals
- Can view analytics

## Security Best Practices

1. ✅ Never expose admin creation endpoint publicly
2. ✅ Use strong passwords for admin accounts
3. ✅ Change default admin password immediately
4. ✅ Limit number of admin accounts
5. ✅ Regularly audit admin access logs
6. ✅ Use environment variables for sensitive data

## Production Deployment

In production:

1. Remove or secure the create-admin script
2. Use environment variables for admin credentials
3. Implement 2FA for admin accounts
4. Set up admin activity logging
5. Regular security audits

## Troubleshooting

**"Email already registered" error:**
- User already exists, use Method 2 to promote them

**"Cannot find module" error:**
- Make sure you're in the project root directory
- Run `npm install` first

**Database locked error:**
- Stop the dev server before running the script
- Or use Method 2 (manual SQL update)
