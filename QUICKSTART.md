# Quick Start Guide

## ✅ You're Almost Ready!

Your backend is already running on `http://localhost:3000`

### Step 1: Start the Frontend

Open a **NEW terminal** and run:

```bash
cd client
npm install
npm start
```

The dashboard will open at `http://localhost:3001`

### Step 2: Test the System

**Submit test content via API:**

```bash
curl -X POST http://localhost:3000/api/content/submit ^
  -H "x-api-key: demo_key" ^
  -H "Content-Type: application/json" ^
  -d "{\"content_type\":\"text\",\"content_text\":\"This is a test message\",\"submitter_id\":\"user123\"}"
```

**Check the dashboard:**
- Go to `http://localhost:3001`
- Click "Review Queue" to see pending items
- Approve or reject content
- View stats on Dashboard tab

### What's Working

✅ SQLite database (no PostgreSQL needed!)
✅ Backend API running on port 3000
✅ All endpoints ready
✅ Queue system (will use in-memory if Redis not available)

### Optional: Add Redis for Queue

If you want the full queue system:

1. Install Redis: https://redis.io/download
2. Start Redis: `redis-server`
3. Restart backend: `npm run dev`

### API Endpoints

- `POST /api/content/submit` - Submit content
- `GET /api/content/:id/status` - Check status
- `GET /api/admin/queue` - Review queue
- `POST /api/admin/:id/approve` - Approve
- `POST /api/admin/:id/reject` - Reject
- `GET /api/analytics/dashboard` - Stats

### Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env file
PORT=3001
```

**Frontend won't connect?**
- Make sure backend is running first
- Check `http://localhost:3000/health` returns OK

### Next Steps

1. Customize the AI service in `src/services/aiService.js`
2. Add real ML API endpoints
3. Deploy to production (see DEPLOYMENT.md)
4. Add authentication (JWT)
5. Take screenshots for LinkedIn! 📸
