import React, { useState, useEffect } from 'react';
import api from '../../api';

function MySubmissions({ userId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealingId, setAppealingId] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [editedUrl, setEditedUrl] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [userId]);

  const loadSubmissions = async () => {
    try {
      // Get user's own submissions
      const response = await api.get('/content/my-submissions');
      setSubmissions(response.data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setLoading(false);
    }
  };

  const handleAppeal = async (contentId) => {
    if (!appealReason.trim() || appealReason.trim().length < 10) {
      alert('Please provide a reason for your appeal (at least 10 characters)');
      return;
    }

    try {
      await api.post('/appeals/submit', {
        content_id: contentId,
        user_reason: appealReason
      });
      
      alert('Appeal submitted successfully! A moderator will review it.');
      setAppealingId(null);
      setAppealReason('');
      loadSubmissions();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit appeal. Please try again.');
    }
  };

  const handleEdit = async (contentId) => {
    if (!editedText.trim() && !editedUrl.trim()) {
      alert('Please provide either text or URL');
      return;
    }

    try {
      await api.put(`/content/${contentId}`, {
        content_text: editedText,
        content_url: editedUrl
      });
      
      alert('Content updated successfully! You can now submit a new appeal.');
      setEditingId(null);
      setEditedText('');
      setEditedUrl('');
      loadSubmissions();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update content');
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedText(item.content_text || '');
    setEditedUrl(item.content_url || '');
  };

  if (loading) return <div className="loading">Loading your submissions...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>My Submissions</h2>
      
      {submissions.length === 0 ? (
        <div className="empty">
          <h3>No submissions yet</h3>
          <p>Submit some content to see it here!</p>
        </div>
      ) : (
        submissions.map(item => (
          <div key={item.id} className="submission-card">
            <div className="submission-header">
              <span className="content-type">{item.content_type}</span>
              <span className={`status-badge status-${item.status || 'pending'}`}>
                {item.status || 'pending'}
              </span>
            </div>

            {editingId === item.id ? (
              <div className="edit-form" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Edit Content:
                </label>
                {item.content_type === 'text' || item.content_text ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    placeholder="Enter your text content..."
                    style={{ width: '100%', minHeight: '100px', padding: '10px', marginBottom: '10px' }}
                  />
                ) : null}
                {item.content_type === 'image' || item.content_type === 'video' ? (
                  <input
                    type="text"
                    value={editedUrl}
                    onChange={(e) => setEditedUrl(e.target.value)}
                    placeholder="Enter media URL..."
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                  />
                ) : null}
                <div className="appeal-actions">
                  <button 
                    className="appeal-submit"
                    onClick={() => handleEdit(item.id)}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="appeal-cancel"
                    onClick={() => {
                      setEditingId(null);
                      setEditedText('');
                      setEditedUrl('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {item.content_text && (
                  <div className="submission-content">{item.content_text}</div>
                )}

                {item.content_url && (
                  <div style={{ marginBottom: '15px' }}>
                    {item.content_type === 'image' ? (
                      <img 
                        src={item.content_url.startsWith('http') ? item.content_url : `http://localhost:3000${item.content_url}`} 
                        alt="Submitted content" 
                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                      />
                    ) : (
                      <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                        View Media →
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ fontSize: '13px', color: '#718096', marginBottom: '10px' }}>
              Submitted: {new Date(item.submitted_at).toLocaleString()}
              {item.processed_at && (
                <> • Processed: {new Date(item.processed_at).toLocaleString()}</>
              )}
            </div>

            {/* Show appeal status and admin's resolution message */}
            {item.appeal_id && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '12px', 
                background: item.appeal_status === 'rejected' ? '#fff5f5' : '#f0f9ff',
                border: `1px solid ${item.appeal_status === 'rejected' ? '#feb2b2' : '#bfdbfe'}`,
                borderRadius: '6px' 
              }}>
                <strong style={{ color: item.appeal_status === 'rejected' ? '#c53030' : '#2563eb' }}>
                  Appeal Status: {item.appeal_status}
                </strong>
                {item.appeal_resolution && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#4a5568' }}>
                    <strong>Admin's Response:</strong>
                    <p style={{ marginTop: '4px', fontStyle: 'italic' }}>
                      "{item.appeal_resolution}"
                    </p>
                  </div>
                )}
                {item.appeal_status === 'rejected' && (
                  <p style={{ marginTop: '8px', fontSize: '13px', color: '#718096' }}>
                    💡 Edit your content based on admin's feedback, then submit a new appeal.
                  </p>
                )}
              </div>
            )}

            {/* Edit button for rejected content */}
            {item.status === 'rejected' && editingId !== item.id && (
              <button 
                className="appeal-btn"
                onClick={() => startEditing(item)}
                style={{ background: '#3b82f6', marginRight: '10px' }}
              >
                ✏️ Edit Content
              </button>
            )}

            {item.status === 'rejected' && appealingId !== item.id && !item.appeal_id && editingId !== item.id && (
              <button 
                className="appeal-btn"
                onClick={() => setAppealingId(item.id)}
              >
                📝 Appeal This Decision
              </button>
            )}

            {item.status === 'rejected' && appealingId !== item.id && item.appeal_status === 'rejected' && editingId !== item.id && (
              <button 
                className="appeal-btn"
                onClick={() => setAppealingId(item.id)}
                style={{ background: '#f59e0b' }}
              >
                📝 Submit New Appeal
              </button>
            )}

            {appealingId === item.id && (
              <div className="appeal-form">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Why should this content be approved?
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you believe this content should be approved... (minimum 10 characters)"
                />
                <div className="appeal-actions">
                  <button 
                    className="appeal-submit"
                    onClick={() => handleAppeal(item.id)}
                  >
                    Submit Appeal
                  </button>
                  <button 
                    className="appeal-cancel"
                    onClick={() => {
                      setAppealingId(null);
                      setAppealReason('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MySubmissions;
