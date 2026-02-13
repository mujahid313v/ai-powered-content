const validateContentSubmission = (req, res, next) => {
  const { content_type, content_text, content_url } = req.body;
  
  if (!content_type || !['text', 'image', 'video'].includes(content_type)) {
    return res.status(400).json({ error: 'Invalid content_type. Must be text, image, or video' });
  }
  
  if (content_type === 'text' && (!content_text || content_text.trim().length === 0)) {
    return res.status(400).json({ error: 'content_text is required for text submissions' });
  }
  
  if (['image', 'video'].includes(content_type) && (!content_url || content_url.trim().length === 0)) {
    return res.status(400).json({ error: 'content_url is required for image/video submissions' });
  }
  
  next();
};

const validateAppeal = (req, res, next) => {
  const { content_id, user_reason } = req.body;
  
  if (!content_id) {
    return res.status(400).json({ error: 'content_id is required' });
  }
  
  if (!user_reason || user_reason.trim().length < 10) {
    return res.status(400).json({ error: 'user_reason must be at least 10 characters' });
  }
  
  next();
};

module.exports = { validateContentSubmission, validateAppeal };
