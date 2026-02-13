import React, { useState, useEffect } from 'react';
import { getReviewQueue, approveContent, rejectContent } from '../api';

function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await getReviewQueue('pending');
      setItems(response.data.items);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load queue:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveContent(id, 'Approved by moderator');
      setItems(items.filter(item => item.content_id !== id));
    } catch (error) {
      alert('Failed to approve content');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    try {
      await rejectContent(id, reason);
      setItems(items.filter(item => item.content_id !== id));
    } catch (error) {
      alert('Failed to reject content');
    }
  };

  if (loading) return <div className="loading">Loading queue...</div>;
  if (items.length === 0) {
    return (
      <div className="empty">
        <h3>✅ All caught up!</h3>
        <p>No items in the review queue</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>
        Review Queue ({items.length} items)
      </h2>

      {items.map(item => (
        <div key={item.id} className="content-card">
          <div className="content-header">
            <span className="content-type">{item.content_type}</span>
            <span className={`score ${getScoreClass(item.overall_score)}`}>
              Score: {item.overall_score || 'N/A'}
            </span>
          </div>

          {item.content_text && (
            <div className="content-text">{item.content_text}</div>
          )}

          {item.content_url && (
            <div style={{ marginBottom: '15px' }}>
              <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                View Media →
              </a>
            </div>
          )}

          <div style={{ fontSize: '13px', color: '#718096', marginBottom: '15px' }}>
            AI Decision: <strong>{item.decision || 'review_needed'}</strong>
            {item.reason && ` - ${item.reason}`}
          </div>

          <div className="actions">
            <button 
              className="btn btn-approve"
              onClick={() => handleApprove(item.content_id)}
            >
              ✓ Approve
            </button>
            <button 
              className="btn btn-reject"
              onClick={() => handleReject(item.content_id)}
            >
              ✗ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getScoreClass(score) {
  if (!score) return 'medium';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default ReviewQueue;
