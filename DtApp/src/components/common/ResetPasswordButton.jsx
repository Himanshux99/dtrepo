import React from 'react';
import { handlePasswordReset } from '../../utils/settingsUtils';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Toaster needs to be present for toasts to display

function ResetPasswordButton() {
    const { currentUser } = useAuth();

    // Pass the current user's email to the utility function
    const email = currentUser?.email;

    return (
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #444', borderRadius: '8px', background: '#2c2c2c' }}>
            <Toaster position="top-center" />
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Account Security</p>
            <button 
                onClick={() => handlePasswordReset(email)} 
                style={{ 
                    padding: '0.75rem', 
                    background: '#ffc107', 
                    color: 'black', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                Reset Password (Send Link to {email})
            </button>
        </div>
    );
}

export default ResetPasswordButton;