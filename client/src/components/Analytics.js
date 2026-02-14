import React, { useState, useEffect } from 'react';
import api from '../api';
import './Analytics.css';

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!data) return <div className="empty">No data available</div>;

  const { overall, last_24_hours, performance, appeals, content_types, recent_activity, top_users } = data;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <button onClick={loadAnalytics} className="refresh-btn">🔄 Refresh</button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <div className="metric-value">{overall.total_submissions || 0}</div>
            <div className="metric-label">Total Submissions</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">{overall.approved_count || 0}</div>
            <div className="metric-label">Approved</div>
            <div className="metric-subtext">{overall.approval_rate}% rate</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{performance.avg_processing_time_formatted}</div>
            <div className="metric-label">Avg Processing Time</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <div className="metric-value">{overall.pending_count || 0}</div>
            <div className="metric-label">Pending Review</div>
          </div>
        </div>
      </div>

      {/* Last 24 Hours */}
      <div className="section-card">
        <h3>📅 Last 24 Hours</h3>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">New Submissions:</span>
            <span className="stat-value">{last_24_hours.total_24h || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <span className="stat-value green">{last_24_hours.approved_24h || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rejected:</span>
            <span className="stat-value red">{last_24_hours.rejected_24h || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <span className="stat-value orange">{last_24_hours.pending_24h || 0}</span>
          </div>
        </div>
      </div>

      {/* Appeals */}
      <div className="section-card">
        <h3>📢 Appeals Overview</h3>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Total Appeals:</span>
            <span className="stat-value">{appeals.total_appeals || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <span className="stat-value orange">{appeals.pending_appeals || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <span className="stat-value green">{appeals.approved_appeals || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rejected:</span>
            <span className="stat-value red">{appeals.rejected_appeals || 0}</span>
          </div>
        </div>
      </div>

      <div className="two-column-layout">
        {/* Content Types */}
        <div className="section-card">
          <h3>📂 Content Types</h3>
          <div className="content-types-list">
            {content_types.map(type => (
              <div key={type.content_type} className="content-type-item">
                <div className="content-type-header">
                  <span className="content-type-name">{type.content_type}</span>
                  <span className="content-type-count">{type.count}</span>
                </div>
                <div className="content-type-bar">
                  <div 
                    className="bar-approved" 
                    style={{ width: `${(type.approved / type.count) * 100}%` }}
                  />
                  <div 
                    className="bar-rejected" 
                    style={{ width: `${(type.rejected / type.count) * 100}%` }}
                  />
                </div>
                <div className="content-type-stats">
                  <span className="green">✓ {type.approved}</span>
                  <span className="red">✗ {type.rejected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="section-card">
          <h3>👥 Top Contributors</h3>
          <div className="top-users-list">
            {top_users.map((user, index) => (
              <div key={user.email} className="top-user-item">
                <div className="user-rank">#{index + 1}</div>
                <div className="user-info">
                  <div className="user-name">{user.full_name || user.email}</div>
                  <div className="user-stats">
                    {user.total_submissions} submissions • {user.approved_count} approved
                  </div>
                </div>
                <div className="user-badge">
                  {Math.round((user.approved_count / user.total_submissions) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section-card">
        <h3>📈 Recent Activity (Last 7 Days)</h3>
        <div className="activity-chart">
          {recent_activity.map(day => {
            const maxValue = Math.max(...recent_activity.map(d => d.submissions));
            const height = (day.submissions / maxValue) * 100;
            return (
              <div key={day.date} className="activity-bar-container">
                <div className="activity-bar" style={{ height: `${height}%` }}>
                  <div className="bar-segment approved" style={{ height: `${(day.approved / day.submissions) * 100}%` }} />
                  <div className="bar-segment rejected" style={{ height: `${(day.rejected / day.submissions) * 100}%` }} />
                </div>
                <div className="activity-label">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div className="activity-count">{day.submissions}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
