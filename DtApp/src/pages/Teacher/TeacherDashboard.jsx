import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function TeacherDashboard() {
  const { currentUser } = useAuth(); // Needed for the welcome message

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Teacher Dashboard</h1>
        <p className="text-secondary">Welcome, {currentUser?.email}</p>
      </div>

      {/* Quick Stats - Kept as is */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📅</div>
            <div>
              <h3 className="text-lg font-semibold">Schedule</h3>
              <p className="text-secondary text-sm">Manage your classes</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📢</div>
            <div>
              <h3 className="text-lg font-semibold">Updates</h3>
              <p className="text-secondary text-sm">Post announcements</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">👤</div>
            <div>
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-secondary text-sm">Update your info</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- NEW SECTION: CORE ACTION CARDS (Profile & Print) --- */}
      {/* This is the new "Main Actions" section that overrides the original */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        
        {/* Profile Card (First Card, links to where class adding is done) */}
        <Link to="/teacher/profile" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-semibold mb-2">Manage Profile</h3>
            <p className="text-secondary">
              Update personal details and **add/manage the classes you teach**.
            </p>
          </div>
        </Link>

        {/* Print Service Card (Second Card, placed right after Profile) */}
        <Link to="/student/print" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">Submit a Print Job</h3>
            <p className="text-secondary">
              Upload documents and manage your print submissions.
            </p>
          </div>
        </Link>
      </div>

      {/* --- SECONDARY ACTION DIV (Schedule & Updates Links) --- */}
      {/* This is the secondary div you requested to be beneath the cards */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4 text-left">Class & Schedule Management</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Schedule Link */}
          <Link to="/teacher/schedule" className="btn btn-secondary flex-1">
            Manage My Schedule
          </Link>
          {/* Updates Link */}
          <Link to="/teacher/updates" className="btn btn-primary flex-1">
            Post Lecture Updates
          </Link>
        </div>
      </div>


      {/* Recent Activity Section (Kept as is) */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">📢</div>
              <div>
                <h4 className="font-medium">Update Posted</h4>
                <p className="text-secondary text-sm">Class cancellation notice - 1 hour ago</p>
              </div>
              <span className="badge badge-success">Published</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">📅</div>
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