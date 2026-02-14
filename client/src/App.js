import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ReviewQueue from './components/ReviewQueue';
import Appeals from './components/Appeals';
import Analytics from './components/Analytics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container">
      <div className="header">
        <h1>🛡️ Content Moderation Platform</h1>
        <div className="nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'queue' ? 'active' : ''}
            onClick={() => setActiveTab('queue')}
          >
            Review Queue
          </button>
          <button 
            className={activeTab === 'appeals' ? 'active' : ''}
            onClick={() => setActiveTab('appeals')}
          >
            Appeals
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'queue' && <ReviewQueue />}
      {activeTab === 'appeals' && <Appeals />}
      {activeTab === 'analytics' && <Analytics />}
    </div>
  );
}

export default App;
