import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      <h1>Admin Dashboard</h1>
      <p>Welcome to your personal dashboard.</p>
      
      {/* ResetPasswordButton component REMOVED from here */}
      
      <Link to="/admin/whitelist" style={{ color: '#ffc107', fontSize: '1.2rem' }}>
        Manage Teacher Whitelist
      </Link>
      
      <Link to="/staff/queue" style={{ color: '#90EE90', fontSize: '1.2rem' }}>
        Manage Print Queue & Admin Tools
      </Link>
    </div>
  );
}

export default AdminDashboard;