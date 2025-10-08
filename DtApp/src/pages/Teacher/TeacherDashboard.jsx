import React from 'react';
import { Link } from 'react-router-dom';

function TeacherDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Teacher Dashboard</h1>
        <p className="text-secondary">Manage your classes and communicate with students</p>
      </div>

      {/* Quick Stats */}
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

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/teacher/schedule" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Manage Schedule</h3>
            <p className="text-secondary">
              Set your weekly schedule, office hours, and availability for students.
            </p>
          </div>
        </Link>

        <Link to="/teacher/updates" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-xl font-semibold mb-2">Post Updates</h3>
            <p className="text-secondary">
              Share announcements, class updates, and important information with students.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
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