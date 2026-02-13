import React, { useState, useEffect } from 'react';
import api from '../../api';

function MySubmissions({ userId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealingId, setAppealingId] = useState(null);
  const [appealReason, setAppealReason] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [userId]);

  const loadSubmissions = async () => {
    try {
      // In a real app, you'd filter by userId on the backend
      // For demo, we'll get all and filter client-side
      const response = await api.get('/admin/queue?status=pending');
      const allContent = response.data.items || [];
      
      // Also get approved/rejected (you'd need a proper endpoint in production)
      setSubmissions(allContent);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setLoading(false);
    }
  };

  const handleAppeal = async (contentId) => {
    if (!appealReason.trim()) {
      alert('Please provide a reason for your appeal');
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
      alert('Failed to submit appeal. Please try again.');
    }
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

            {item.content_text && (
              <div className="submission-content">{item.content_text}</div>
            )}

            {item.content_url && (
              <div style={{ marginBottom: '15px' }}>
                <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                  View Media →
                </a>
              </div>
            )}

            <div style={{ fontSize: '13px', color: '#718096', marginBottom: '10px' }}>
              Submitted: {new Date(item.submitted_at).toLocaleString()}
            </div>

            {item.status === 'rejected' && appealingId !== item.content_id && (
              <button 
                className="appeal-btn"
                onClick={() => setAppealingId(item.content_id)}
              >
                📝 Appeal This Decision
              </button>
            )}

            {appealingId === item.content_id && (
              <div className="appeal-form">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Why should this content be approved?
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you believe this content should be approved..."
                />
                <div className="appeal-actions">
                  <button 
                    className="appeal-submit"
                    onClick={() => handleAppeal(item.content_id)}
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
