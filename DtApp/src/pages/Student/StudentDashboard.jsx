import React from 'react';
import { Link } from 'react-router-dom';

function StudentDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Student Dashboard</h1>
        <p className="text-secondary">Welcome to your personal academic hub</p>
      </div>

      {/* Quick Stats - ADJUSTED TO GRID-COLS-4 */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {/* Schedule Stat */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📅</div>
            <div>
              <h3 className="text-lg font-semibold">Schedule</h3>
              <p className="text-secondary text-sm">View your classes</p>
            </div>
          </div>
        </div>
        
        {/* Print Jobs Stat */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🖨️</div>
            <div>
              <h3 className="text-lg font-semibold">Print Jobs</h3>
              <p className="text-secondary text-sm">Manage your printing</p>
            </div>
          </div>
        </div>
        
        {/* V-Refer Stat (NEW) */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📚</div>
            <div>
              <h3 className="text-lg font-semibold">V-Refer</h3>
              <p className="text-secondary text-sm">Access notes & resources</p>
            </div>
          </div>
        </div>

        {/* Profile Stat */}
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

      {/* Main Actions - ADJUSTED TO GRID-COLS-4 for wider screens */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Schedule Action Card */}
        <Link to="/student/schedule" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">View My Schedule</h3>
            <p className="text-secondary">
              Check your class schedule, upcoming events, and academic calendar.
            </p>
          </div>
        </Link>

        {/* Print Services Action Card */}
        <Link to="/student/print" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">🖨️</div>
            <h3 className="text-xl font-semibold mb-2">Print Services</h3>
            <p className="text-secondary">
              Submit print jobs, track status, and manage your printing preferences.
            </p>
          </div>
        </Link>

        {/* V-REFER ACTION CARD */}
        <Link to="/student/v-refer" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">V-Refer</h3>
            <p className="text-secondary">
              Access personalized notes and academic resources.
            </p>
          </div>
        </Link>

        {/* Profile Action Card */}
        <Link to="/student/profile" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-semibold mb-2">My Profile</h3>
            <p className="text-secondary">
              View and update your personal information and academic details.
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
              <div className="text-2xl">📄</div>
              <div>
                <h4 className="font-medium">Print Job Submitted</h4>
                <p className="text-secondary text-sm">Assignment document - 2 hours ago</p>
              </div>
              <span className="badge badge-warning">In Progress</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">📅</div>
              <div>
                <h4 className="font-medium">Schedule Updated</h4>
                <p className="text-secondary text-sm">New class added to your schedule</p>
              </div>
              <span className="badge badge-success">Updated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;