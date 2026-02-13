# Deployment Guide

## Production Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `client`
4. Add environment variable: `REACT_APP_API_URL=your-backend-url`
5. Deploy

**Backend (Railway):**
1. Create new project in Railway
2. Add PostgreSQL and Redis services
3. Deploy from GitHub
4. Add environment variables from `.env.example`
5. Run migrations: `npm run migrate`

### Option 2: AWS (Full Stack)

**Backend:**
- EC2 instance or Elastic Beanstalk
- RDS for PostgreSQL
- ElastiCache for Redis
- S3 for media storage

**Frontend:**
- S3 + CloudFront for static hosting
- Or deploy with backend on same EC2

### Option 3: Docker Compose (Self-hosted)

```bash
docker-compose up -d
```

## Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=content_moderation
DB_USER=your-user
DB_PASSWORD=strong-password
REDIS_HOST=your-redis-host
API_KEY=generate-strong-key
ML_API_KEY=your-ml-api-key
FRONTEND_URL=https://your-frontend-domain.com
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong API keys
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Implement proper JWT authentication
- [ ] Add input sanitization
- [ ] Enable audit logging

## Performance Optimization

- Use Redis caching for frequent queries
- Add database indexes (already in schema)
- Enable gzip compression
- Use CDN for static assets
- Implement pagination for large datasets
- Monitor queue performance
- Scale Redis and PostgreSQL as needed
