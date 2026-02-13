import React, { useState } from 'react';
import SubmitContent from './components/user/SubmitContent';
import MySubmissions from './components/user/MySubmissions';
import './UserApp.css';

function UserApp() {
  const [activeTab, setActiveTab] = useState('submit');
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));

  return (
    <div className="user-container">
      <div className="user-header">
        <h1>📝 Content Submission Portal</h1>
        <p className="user-id">Your ID: {userId}</p>
        <div className="user-nav">
          <button 
            className={activeTab === 'submit' ? 'active' : ''}
            onClick={() => setActiveTab('submit')}
          >
            Submit Content
          </button>
          <button 
            className={activeTab === 'submissions' ? 'active' : ''}
            onClick={() => setActiveTab('submissions')}
          >
            My Submissions
          </button>
        </div>
      </div>

      {activeTab === 'submit' && <SubmitContent userId={userId} />}
      {activeTab === 'submissions' && <MySubmissions userId={userId} />}
    </div>
  );
}

export default UserApp;
