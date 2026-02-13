import React, { useState } from 'react';
import api from '../../api';

function SubmitContent({ userId }) {
  const [contentType, setContentType] = useState('text');
  const [contentText, setContentText] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        content_type: contentType
      };

      if (contentType === 'text') {
        payload.content_text = contentText;
      } else {
        payload.content_url = contentUrl;
      }

      const response = await api.post('/content/submit', payload);
      
      setMessage({
        type: 'success',
        text: `Content submitted successfully! ID: ${response.data.content_id}. Check "My Submissions" to track status.`
      });
      
      setContentText('');
      setContentUrl('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit content. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-form">
      <h2 style={{ marginBottom: '20px' }}>Submit Content for Moderation</h2>
      
      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Content Type</label>
          <select 
            value={contentType} 
            onChange={(e) => setContentType(e.target.value)}
            required
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {contentType === 'text' ? (
          <div className="form-group">
            <label>Your Content</label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Enter your text content here..."
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label>{contentType === 'image' ? 'Image URL' : 'Video URL'}</label>
            <input
              type="url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder={`https://example.com/${contentType}.jpg`}
              required
            />
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px' }}>
        <strong>ℹ️ What happens next?</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Your content will be analyzed by our AI system</li>
          <li>Safe content is auto-approved within seconds</li>
          <li>Uncertain content goes to human moderators</li>
          <li>You can track status in "My Submissions"</li>
          <li>If rejected, you can submit an appeal</li>
        </ul>
      </div>
    </div>
  );
}

export default SubmitContent;
