import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getAnalytics } from '../api';

function Dashboard() {
  const { queueStats, isConnected, connectionStatus } = useSocket();
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
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty">No data available</div>;

  const { overall, last_24_hours, performance, appeals } = stats;

  return (
    <div>
      <div className="dashboard-header">
        <h2 style={{ marginBottom: '10px', fontSize: '20px' }}>Dashboard Overview</h2>
        <div className={`connection-indicator connection-indicator-${connectionStatus}`}>
          <span className="connection-dot"></span>
          <span>{isConnected ? 'Live Updates Active' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Submissions</h3>
          <div className="value" style={{ color: '#4299e1' }}>
            {overall?.total_submissions || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '5px' }}>
            {overall?.approval_rate || 0}% approval rate
          </div>
        </div>

        <div className="stat-card live-stat">
          <h3>
            Pending Review
            <span className="live-badge">LIVE</span>
          </h3>
          <div className="value" style={{ color: '#ed8936' }}>
            {queueStats.pendingCount || overall?.pending_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Approved</h3>
          <div className="value" style={{ color: '#48bb78' }}>
            {overall?.approved_count || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Rejected</h3>
          <div className="value" style={{ color: '#e53e3e' }}>
            {overall?.rejected_count || 0}
          </div>
        </div>

        <div className="stat-card live-stat">
          <h3>
            Under Review
            <span className="live-badge">LIVE</span>
          </h3>
          <div className="value" style={{ color: '#ed8936' }}>
            {queueStats.reviewCount || 0}
          </div>
        </div>

        <div className="stat-card live-stat">
          <h3>
            Today's Submissions
            <span className="live-badge">LIVE</span>
          </h3>
          <div className="value" style={{ color: '#4299e1' }}>
            {queueStats.totalToday || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Avg Processing Time</h3>
          <div className="value" style={{ fontSize: '24px' }}>
            {performance?.avg_processing_time_formatted || '0s'}
          </div>
        </div>

        <div className="stat-card">
          <h3>Pending Appeals</h3>
          <div className="value" style={{ color: '#805ad5' }}>
            {appeals?.pending_appeals || 0}
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '18px' }}>Last 24 Hours</h3>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <h3>New Submissions</h3>
          <div className="value" style={{ color: '#4299e1' }}>
            {last_24_hours?.total_24h || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Approved</h3>
          <div className="value" style={{ color: '#48bb78' }}>
            {last_24_hours?.approved_24h || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Rejected</h3>
          <div className="value" style={{ color: '#e53e3e' }}>
            {last_24_hours?.rejected_24h || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <div className="value" style={{ color: '#ed8936' }}>
            {last_24_hours?.pending_24h || 0}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
