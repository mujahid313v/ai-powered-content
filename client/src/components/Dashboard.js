import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await getAnalytics();
      setStats(response.data.last_24_hours);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty">No data available</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Last 24 Hours</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Pending Review</h3>
          <div className="value" style={{ color: '#ed8936' }}>
            {stats.content.pending_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Approved</h3>
          <div className="value" style={{ color: '#48bb78' }}>
            {stats.content.approved_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Rejected</h3>
          <div className="value" style={{ color: '#e53e3e' }}>
            {stats.content.rejected_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Under Review</h3>
          <div className="value" style={{ color: '#4299e1' }}>
            {stats.content.under_review_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Avg Processing Time</h3>
          <div className="value" style={{ fontSize: '24px' }}>
            {stats.avg_processing_time_seconds}s
          </div>
        </div>

        <div className="stat-card">
          <h3>Pending Appeals</h3>
          <div className="value" style={{ color: '#805ad5' }}>
            {stats.appeals.pending_appeals || 0}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
