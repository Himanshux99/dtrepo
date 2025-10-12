// src/components/TestNotification.jsx
// Use this component to test notifications in development

import React, { useState } from 'react';
import { sendNotificationToUser } from '../utils/notificationHelper';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function TestNotification() {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test notification!');

  const handleSendTest = async () => {
    if (!currentUser) {
      toast.error('Please log in first');
      return;
    }

    try {
      await sendNotificationToUser(
        currentUser.uid,
        title,
        body,
        { type: 'test', url: '/' }
      );
      toast.success('Test notification sent!');
    } catch (error) {
      toast.error('Failed to send notification');
      console.error(error);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: '#2c2c2c', 
      borderRadius: '8px',
      maxWidth: '500px',
      margin: '2rem auto'
    }}>
      <h2>Test Notifications</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#333',
            border: '1px solid #555',
            color: 'white',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows="3"
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#333',
            border: '1px solid #555',
            color: 'white',
            borderRadius: '4px'
          }}
        />
      </div>

      <button
        onClick={handleSendTest}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Send Test Notification to Myself
      </button>

      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#aaa' }}>
        <p>This will send a notification to your current device.</p>
        <p>Make sure you've enabled notifications in Settings first!</p>
      </div>
    </div>
  );
}

export default TestNotification;