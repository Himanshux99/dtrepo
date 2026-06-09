import React from 'react';
import { Link } from 'react-router-dom';

function TeacherDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
      <h1>Teacher Dashboard</h1>
      <p>Welcome to your personal dashboard.</p>
      <Link to="/teacher/schedule" style={{ color: '#90EE90', fontSize: '1.2rem' }}>
        Manage Weekly Schedule
      </Link>
      <Link to="/teacher/updates" style={{ color: '#87CEEB', fontSize: '1.2rem' }}>
        Post an Update
      </Link>
    </div>
  );
}

export default TeacherDashboard;