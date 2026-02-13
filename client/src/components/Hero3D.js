import React from 'react';
import './Hero3D.css';

function Hero3D() {
  return (
    <div className="hero-container">
      {/* Pure CSS 3D Sphere */}
      <div className="sphere-container">
        <div className="sphere">
          <div className="sphere-inner"></div>
          <div className="sphere-glow"></div>
        </div>
      </div>

      {/* Glassmorphism Content Overlay */}
      <div className="hero-content">
        <div className="glass-card">
          <div className="badge">
            <span className="badge-dot"></span>
            AI-Powered Platform
          </div>
          
          <h1 className="hero-title">
            Content Moderation
            <br />
            <span className="gradient-text">Reimagined</span>
          </h1>
          
          <p className="hero-description">
            Harness the power of AI to automatically detect and filter harmful content.
            Real-time analysis, human-in-the-loop workflows, and comprehensive analytics.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary">
              Get Started
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button className="btn-secondary">
              Watch Demo
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">&lt;100ms</div>
              <div className="stat-label">Response Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Background Gradient */}
      <div className="gradient-bg"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Hero3D;
