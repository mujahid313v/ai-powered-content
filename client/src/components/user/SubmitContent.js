import React, { useState } from 'react';
import api from '../../api';

function SubmitContent({ userId }) {
  const [contentType, setContentType] = useState('text');
  const [contentText, setContentText] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      console.log('Starting submission...', { contentType, file, contentUrl });
      
      let payload = {
        content_type: contentType
      };

      if (contentType === 'text') {
        payload.content_text = contentText;
        console.log('Submitting text:', payload);
      } else {
        // For image/video, upload file first
        if (file) {
          console.log('Uploading file...', file.name);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('content_type', contentType);

          const uploadResponse = await api.post('/content/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log('Upload response:', uploadResponse.data);
          payload.content_url = uploadResponse.data.url;
        } else if (contentUrl) {
          // Or use provided URL
          payload.content_url = contentUrl;
          console.log('Using URL:', contentUrl);
        } else {
          throw new Error('Please upload a file or provide a URL');
        }
      }

      console.log('Submitting content:', payload);
      const response = await api.post('/content/submit', payload);
      console.log('Submit response:', response.data);
      
      setMessage({
        type: 'success',
        text: `Content submitted successfully! ID: ${response.data.content_id}. Check "My Submissions" to track status.`
      });
      
      // Reset form
      setContentText('');
      setContentUrl('');
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error response:', error.response?.data);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Failed to submit content. Please try again.'
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
            onChange={(e) => {
              setContentType(e.target.value);
              setFile(null);
              setPreview(null);
              setContentUrl('');
            }}
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
          <>
            <div className="form-group">
              <label>Upload {contentType === 'image' ? 'Image' : 'Video'}</label>
              <input
                type="file"
                accept={contentType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="file-input"
              />
              {preview && (
                <div className="preview-container">
                  {contentType === 'image' ? (
                    <img src={preview} alt="Preview" className="preview-image" />
                  ) : (
                    <video src={preview} controls className="preview-video" />
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Or provide {contentType === 'image' ? 'Image' : 'Video'} URL</label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder={`https://example.com/${contentType}.${contentType === 'image' ? 'jpg' : 'mp4'}`}
                disabled={!!file}
              />
              <small style={{ color: '#718096', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {file ? 'File selected. Clear file to use URL instead.' : 'Upload a file or provide a URL'}
              </small>
            </div>
          </>
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
