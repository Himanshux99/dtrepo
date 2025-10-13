import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays , Settings ,Link as LinkIcon,Printer} from "lucide-react"; // icon library
import { useLocation } from 'react-router-dom';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Function to determine the settings/profile link for all roles
  const getSettingsLink = () => {
    switch (currentUser?.role) {
      case 'student':
      case 'teacher':
        return `/${currentUser.role}/settings`; 
      case 'staff':
      case 'admin':
        return `/${currentUser.role}/settings`; 
      default:
        return '/';
    }
  };

  // Function to get dashboard link based on role
  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case 'student':
        return '/student';
      case 'teacher':
        return '/teacher';
      case 'staff':
        return '/staff';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  // Function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Teacher';
      case 'staff':
        return 'Staff';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };


// Define tab data for easier management, adapting to user role
const getTabsForRole = (role) => {
    switch (role) {
        case 'student':
            return [
                {
                    label: "V-Refer",
                    icon: <LinkIcon size={24} />,
                    path: "/student/v-refer"
                },
                {
                    label: "V-Print",
                    icon: <Printer size={24} />,
                    path: "/student/print"
                },
                {
                    label: "Schedule",
                    icon: <CalendarDays size={24} />,
                    path: "/student/schedule"
                },
                {
                    label: "Settings",
                    icon: <Settings size={24} />,
                    path: "/student/settings"
                }
            ];
        case 'teacher':
            return [
                {
                    label: "Schedule",
                    icon: <CalendarDays size={24} />,
                    path: "/teacher/schedule"
                },
                {
                    label: "Settings",
                    icon: <Settings size={24} />,
                    path: "/teacher/settings"
                }
            ];
        case 'staff':
            return [
                {
                    label: "Dashboard",
                    icon: <CalendarDays size={24} />,
                    path: "/staff"
                },
                {
                    label: "Settings",
                    icon: <Settings size={24} />,
                    path: "/staff/settings"
                }
            ];
        case 'admin':
            return [
                {
                    label: "Dashboard",
                    icon: <CalendarDays size={24} />,
                    path: "/admin"
                },
                {
                    label: "Settings",
                    icon: <Settings size={24} />,
                    path: "/admin/settings"
                }
            ];
        default:
            return [];
    }
};

const location = useLocation();
const tabs = getTabsForRole(currentUser?.role);

return (
    <nav className="fixed bottom-4 left-6 right-6 bg-primary shadow-md border-2 border-white rounded-full">
        <div className="flex justify-around items-center text-white mx-4 py-2">
            {tabs.map(tab => {
                const isActive = location.pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        className={`tabButton flex flex-col items-center text-sm "}`}
                        onClick={() => navigate(tab.path, { replace: true })}
                    >
                        {isActive ? <span className="text-secondary bg-white rounded-full p-2">{tab.icon}</span> :<span className="p-1.5">{tab.icon}</span>}
                        <span className="text-xs text-white font-inter font-bold">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    </nav>
);
}

export default Navbar;