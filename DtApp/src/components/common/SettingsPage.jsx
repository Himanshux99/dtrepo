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
        <div className="max-w-[600px] mx-auto m-8 pb-16 rounded-lg  text-white text-center">
            <Toaster position="top-center" />

            <div className=" grid grid-cols-1 gap-4 text-left bg-white p-8 rounded-lg">
                {/* <NotificationSettings />

                <ResetPasswordButton /> */}

                {/* 3. Theme Toggle (Placeholder) */}
                <button
                    onClick={() => handlePlaceholderClick('Change Theme')}
                    className='flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold font-inter'
                >
                    Change Theme (Placeholder)
                </button>

                {/* 3. Notifications Toggle (Placeholder) */}
                <button
                    onClick={() => handlePlaceholderClick('Notifications')}
                    className='flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold font-inter'
                >
                    Notification Settings (Placeholder)
                </button>

                <button onClick={handleLogout} className='flex flex-col items-center p-2 bg-secondary border-4 border-[var(--bg-primary)] rounded-lg text-secondary font-bold font-inter text-xl'
                >
                    Logout
                </button>

                <hr style={{ width: '100%', borderTop: '1px solid #555' }} />

                {/* 4. About App (Placeholder) */}
                <button
                    onClick={() => handlePlaceholderClick('About App')}
                    className='flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold font-inter'
                >
                    About App
                </button>

                {/* 5. Submit Feedback (Placeholder) */}
                <button
                    onClick={() => handlePlaceholderClick('Submit Feedback')}
                    className='flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold font-inter'
                >
                    Submit Feedback
                </button>

                {/* 6. Contact Us (Placeholder) */}
                <button
                    onClick={() => handlePlaceholderClick('Contact Us')}
                    className='flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold font-inter'
                >
                    Contact Us
                </button>
            </div>
        </div>
    );
}

export default SettingsPage;