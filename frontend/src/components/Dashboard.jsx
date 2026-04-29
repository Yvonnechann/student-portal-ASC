import React, { useState } from 'react';
import Grades from './Grades.jsx';
import Assignments from './Assignments.jsx';
import Messages from './Messages.jsx';
import Profile from './Profile.jsx';

export default function Dashboard({ user, token }) {
  const [tab, setTab] = useState('grades');

  const studentTabs = [
    { id: 'grades',      label: 'My Grades' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'messages',    label: 'Messages' },
    { id: 'profile',     label: 'My Profile' },
  ];

  const lecturerTabs = [
    { id: 'grades',      label: 'All Grades' },
    { id: 'assignments', label: 'Submitted Files' },
    { id: 'messages',    label: 'Send Message' },
    { id: 'profile',     label: 'My Profile' },
  ];

  const tabs = user.role === 'lecturer' ? lecturerTabs : studentTabs;

  return (
    <div className="page-container">
      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grades'      && <Grades      user={user} token={token} />}
      {tab === 'assignments' && <Assignments user={user} token={token} />}
      {tab === 'messages'    && <Messages    user={user} token={token} />}
      {tab === 'profile'     && <Profile     user={user} token={token} />}
    </div>
  );
}
