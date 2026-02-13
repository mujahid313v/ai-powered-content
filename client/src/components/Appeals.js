import React, { useState, useEffect } from 'react';
import { resolveAppeal } from '../api';
import api from '../api';

function Appeals() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      const response = await api.get('/appeals/pending');
      setAppeals(response.data.appeals);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load appeals:', error);
      setLoading(false);
    }
  };

  const handleResolve = async (appealId, decision) => {
    const notes = prompt(`Resolution notes for ${decision}:`);
    if (!notes) return;

    try {
      await resolveAppeal(appealId, decision, notes);
      setAppeals(appeals.filter(a => a.id !== appealId));
    } catch (error) {
      alert('Failed to resolve appeal');
    }
  };

  if (loading) return <div className="loading">Loading appeals...</div>;
  if (appeals.length === 0) {
    return (
      <div className="empty">
        <h3>No pending appeals</h3>
        <p>All appeals have been resolved</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>
        Pending Appeals ({appeals.length})
      </h2>

      {appeals.map(appeal => (
        <div key={appeal.id} className="content-card">
          <div className="content-header">
            <span className="content-type">{appeal.content_type} - Appeal #{appeal.id}</span>
            <span style={{ fontSize: '12px', color: '#718096' }}>
              {new Date(appeal.created_at).toLocaleDateString()}
            </span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Original Content:</strong>
            {appeal.content_text && (
              <div className="content-text" style={{ marginTop: '8px' }}>{appeal.content_text}</div>
            )}
            {appeal.content_url && (
              <div style={{ marginTop: '8px' }}>
                <a href={appeal.content_url} target="_blank" rel="noopener noreferrer">
                  View Media →
                </a>
              </div>
            )}
          </div>

          <div style={{ marginTop: '15px', padding: '15px', background: '#fffaf0', borderRadius: '6px', border: '1px solid #ffd700' }}>
            <strong>User's Appeal Reason:</strong>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>
              {appeal.user_reason || 'No reason provided'}
            </p>
          </div>

          <div className="actions" style={{ marginTop: '15px' }}>
            <button 
              className="btn btn-approve"
              onClick={() => handleResolve(appeal.id, 'approved')}
            >
              ✓ Approve Appeal
            </button>
            <button 
              className="btn btn-reject"
              onClick={() => handleResolve(appeal.id, 'rejected')}
            >
              ✗ Deny Appeal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Appeals;
