// src/components/common/NotificationSettings.jsx
import React from 'react';
import useFCM from '../../hooks/useFCM';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function NotificationSettings() {
  const { currentUser } = useAuth();
  const { notificationPermission, requestPermission, fcmToken } = useFCM(currentUser);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications enabled successfully!');
    }
  };

  const getPermissionStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Enabled ✓';
      case 'denied':
        return 'Blocked (Enable in browser settings)';
      default:
        return 'Not enabled';
    }
  };

  const getPermissionStatusColor = () => {
    switch (notificationPermission) {
      case 'granted':
        return '#28a745';
      case 'denied':
        return '#dc3545';
      default:
        return '#ffc107';
    }
  };

  return (
    <div
      style={{
        padding: '1rem',
        background: '#2c2c2c',
        borderRadius: '8px',
        border: '1px solid #444',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Push Notifications</h4>
          <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
            Status: <span style={{ color: getPermissionStatusColor(), fontWeight: 'bold' }}>
              {getPermissionStatusText()}
            </span>
          </p>
        </div>
        
        {notificationPermission !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: notificationPermission === 'denied' ? 'not-allowed' : 'pointer',
              opacity: notificationPermission === 'denied' ? 0.5 : 1,
            }}
            disabled={notificationPermission === 'denied'}
          >
            Enable Notifications
          </button>
        )}
      </div>

      {notificationPermission === 'denied' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#3d2020',
            borderLeft: '4px solid #dc3545',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Notifications are blocked. To enable them:
            <br />
            1. Click the lock icon in your browser&apos;s address bar
            <br />
            2. Find &quot;Notifications&quot; and select &quot;Allow&quot;
            <br />
            3. Refresh this page
          </p>
        </div>
      )}

      {fcmToken && (
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
          Device registered for notifications ✓
        </div>
      )}
    </div>
  );
}

export default NotificationSettings;