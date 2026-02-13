# AI-Powered Content Moderation Platform

Full-stack real-time content filtering system that analyzes user-generated content (text, images, videos) using AI/ML models.

## Features

- 🤖 Multi-modal content analysis (text, image, video)
- 🧠 ML model integration (toxicity detection, NSFW filtering)
- ⚡ Queue-based processing for scalability
- 📊 Real-time admin dashboard with live stats
- 👥 Human-in-the-loop review workflows
- 📝 Appeal system for rejected content
- 📈 Analytics and reporting engine

## Tech Stack

- **Frontend**: React 18 + Modern CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Queue**: Bull + Redis
- **AI/ML**: Custom ML APIs (configurable)

## Setup

### Quick Start (SQLite - Zero Config!)

**Terminal 1 - Backend:**
```bash
npm install
npm run migrate
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm start
```

Dashboard opens at `http://localhost:3001` 🚀

### Create Admin Account

For testing, create an admin/moderator account:

```bash
npm run create-admin admin@test.com admin123 "Test Admin"
```

Then login with:
- Email: `admin@test.com`
- Password: `admin123`

See [ADMIN_SETUP.md](ADMIN_SETUP.md) for detailed admin setup instructions.

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

### PostgreSQL Setup (Optional)

If you prefer PostgreSQL over SQLite:

1. Install PostgreSQL and Redis
2. Update `.env` with your database credentials:
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_moderation
DB_USER=postgres
DB_PASSWORD=your_password
```
3. Run: `npm run migrate:pg`

## API Endpoints

### Content Submission
- `POST /api/content/submit` - Submit content for moderation
- `POST /api/content/batch` - Batch submit multiple items
- `GET /api/content/:id/status` - Check content status

### Admin/Moderation
- `GET /api/admin/queue` - Get review queue
- `POST /api/admin/:id/approve` - Approve content
- `POST /api/admin/:id/reject` - Reject content
- `POST /api/admin/bulk` - Bulk approve/reject

### Appeals
- `POST /api/appeals/submit` - Submit appeal
- `GET /api/appeals/:id` - Get appeal status
- `POST /api/appeals/:id/resolve` - Resolve appeal (moderator)

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats

## Authentication

All endpoints require authentication headers:
- `x-api-key`: Your API key
- `x-user-role`: moderator or admin (for admin endpoints)

## Example Usage

```bash
# Submit text content
curl -X POST http://localhost:3000/api/content/submit \
  -H "x-api-key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "text",
    "content_text": "Sample text to moderate",
    "submitter_id": "user123"
  }'

# Check status
curl http://localhost:3000/api/content/1/status \
  -H "x-api-key: your_key"
```

## Architecture

1. Content submitted via API
2. Added to Bull queue for async processing
3. AI service analyzes content
4. Auto-decision or human review queue
5. Moderators review uncertain cases
6. Users can appeal rejected content
7. Analytics track all metrics

## License

MIT
