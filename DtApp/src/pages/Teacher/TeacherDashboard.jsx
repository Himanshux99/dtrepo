import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Megaphone, User } from 'lucide-react';
function TeacherDashboard() {
  const { currentUser } = useAuth(); // Needed for the welcome message

  return (
    <div className="container px-8 py-8 text-secondary font-bold pb-16">
      {/* Header */}
      <div className="m-4">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">Teacher Dashboard</h1>
      </div>

      {/* Quick Stats - Kept as is */}
      <div className="grid md:grid-cols-3 gap-3 mx-4 mb-8">
        <Link to="/teacher/schedule">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="text-3xl"><CalendarDays size={40} /></div>
              <div>
                <h3 className="text-lg">Schedule</h3>
                <p className="text-secondary text-sm">Manage your classes</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/teacher/updates">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="text-3xl"><Megaphone size={40} /></div>
              <div>
                <h3 className="text-lg">Updates</h3>
                <p className="text-secondary text-sm">Post announcements</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/teacher/profile">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="text-3xl"><User size={40} /></div>
              <div>
                <h3 className="text-lg">Profile</h3>
                <p className="text-secondary text-sm">Add/Manage classes and info</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* --- SECONDARY ACTION DIV (Schedule & Updates Links) --- */}
      {/* This is the secondary div you requested to be beneath the cards */}
      <div className="card p-6 mx-4">
        <h2 className="text-2xl mb-4 text-left">Class & Schedule Management</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Schedule Link */}
          <Link to="/teacher/schedule" className="btn-secondary">
            Manage My Schedule
          </Link>
          {/* Updates Link */}
          <Link to="/teacher/updates" className="btn-main">
            Post Lecture Updates
          </Link>
        </div>
      </div>


      {/* Recent Activity Section (Kept as is) */}
      <div className="mt-6 mx-4">
        <h2 className="text-2xl mb-3 text-white">Recent Activity</h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl"><Megaphone size={30}/></div>
              <div>
                <h4 className="font-medium">Update Posted</h4>
                <p className="text-secondary text-sm">Class cancellation notice - 1 hour ago</p>
              </div>
              <span className="badge badge-success">Published</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl"><CalendarDays size={30}/></div>
              <div>
                <h4 className="font-medium">Schedule Updated</h4>
                <p className="text-secondary text-sm">Office hours changed for next week</p>
              </div>
              <span className="badge badge-warning">Modified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;