// Simple auth middleware (extend with JWT in production)
const authenticateUser = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

const authenticateModerator = (req, res, next) => {
  // In production, verify JWT and check role
  const role = req.headers['x-user-role'];
  
  if (!role || !['moderator', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Moderator access required' });
  }
  
  req.user = { role };
  next();
};

module.exports = { authenticateUser, authenticateModerator };
