// src/components/common/SettingsPage.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ResetPasswordButton from './ResetPasswordButton';
import NotificationSettings from './NotificationSettings';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
function SettingsPage() {
      const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const userEmail = currentUser?.email || 'N/A';
    const role = currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1) || 'User';

    const handlePlaceholderClick = (feature) => {
        toast.info(`'${feature}' feature placeholder. Future implementation needed.`, { duration: 3000 });
    };

    const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', border: '1px solid #444', borderRadius: '8px', background: '#2c2c2c', color: 'white', textAlign: 'center' }}>
            <Toaster position="top-center" />
            
            <h1>{role} Settings</h1>
            <p>Manage account security and application preferences for {userEmail}.</p>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', textAlign: 'left' }}>
                
                {/* 1. Notification Settings (NEW - FULLY FUNCTIONAL) */}
                <NotificationSettings />
                
                {/* 2. Reset Password (FULLY OPERATIONAL) */}
                <ResetPasswordButton />
                
                {/* --- Placeholders --- */}
                
                {/* 3. Theme Toggle (Placeholder) */}
                <button 
                    onClick={() => handlePlaceholderClick('Change Theme')}
                    style={{ padding: '0.75rem', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Change Theme (Placeholder)
                </button>
                
                {/* 3. Notifications Toggle (Placeholder) */}
                <button 
                    onClick={() => handlePlaceholderClick('Notifications')}
                    style={{ padding: '0.75rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Notification Settings (Placeholder)
                </button>
                
                <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.75rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                  Logout
                                </button>

                <hr style={{width: '100%', borderTop: '1px solid #555'}}/>

                {/* 4. About App (Placeholder) */}
                <button 
                    onClick={() => handlePlaceholderClick('About App')}
                    style={{ padding: '0.75rem', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    About App
                </button>

                {/* 5. Submit Feedback (Placeholder) */}
                <button 
                    onClick={() => handlePlaceholderClick('Submit Feedback')}
                    style={{ padding: '0.75rem', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Submit Feedback
                </button>

                {/* 6. Contact Us (Placeholder) */}
                <button 
                    onClick={() => handlePlaceholderClick('Contact Us')}
                    style={{ padding: '0.75rem', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Contact Us
                </button>
            </div>
        </div>
    );
}

export default SettingsPage;