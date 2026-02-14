import React, { useState, useEffect } from 'react';
import App from './App';
import UserApp from './UserApp';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Hero3D from './components/Hero3D';
import Analytics from './components/Analytics';
import './Portal.css';

function Portal() {
  const [mode, setMode] = useState('user');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setShowHero(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowHero(false);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setShowHero(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowHero(true);
  };

  const handleGetStarted = () => {
    setShowHero(false);
  };

  // Show Hero Section
  if (showHero && !user) {
    return (
      <div>
        <Hero3D />
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <button 
            onClick={handleGetStarted}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              fontWeight: '600'
            }}
          >
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  // Show Auth
  if (!user) {
    return authView === 'login' ? (
      <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Show Dashboard
  return (
    <div>
      <div className="mode-switcher">
        <button 
          className={mode === 'user' ? 'active' : ''}
          onClick={() => setMode('user')}
        >
          👤 User Portal
        </button>
        {user.role === 'moderator' && (
          <button 
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            🛡️ Admin Dashboard
          </button>
        )}
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      {mode === 'user' ? <UserApp user={user} /> : <App />}
    </div>
  );
}

export default Portal;
