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
      const response = await api.get('/admin/queue?status=pending');
      const appealItems = response.data.items.filter(item => item.priority >= 9);
      setAppeals(appealItems);
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
            <span className="content-type">Appeal #{appeal.id}</span>
            <span style={{ fontSize: '12px', color: '#718096' }}>
              Priority: {appeal.priority}
            </span>
          </div>

          {appeal.content_text && (
            <div className="content-text">{appeal.content_text}</div>
          )}

          <div style={{ marginTop: '15px', padding: '15px', background: '#fffaf0', borderRadius: '6px' }}>
            <strong>User's Appeal:</strong>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>
              {appeal.user_reason || 'No reason provided'}
            </p>
          </div>

          <div className="actions" style={{ marginTop: '15px' }}>
            <button 
              className="btn btn-approve"
              onClick={() => handleResolve(appeal.id, 'approved')}
            >
              Approve Appeal
            </button>
            <button 
              className="btn btn-reject"
              onClick={() => handleResolve(appeal.id, 'rejected')}
            >
              Deny Appeal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Appeals;
