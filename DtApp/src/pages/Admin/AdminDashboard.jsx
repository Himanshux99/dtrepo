import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
        <p className="text-secondary">System administration and user management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">👥</div>
            <div>
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-secondary text-sm">Manage user access</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📋</div>
            <div>
              <h3 className="text-lg font-semibold">System Tools</h3>
              <p className="text-secondary text-sm">Admin operations</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔒</div>
            <div>
              <h3 className="text-lg font-semibold">Security</h3>
              <p className="text-secondary text-sm">Access control</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/whitelist" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Teacher Whitelist</h3>
            <p className="text-secondary">
              Manage teacher access permissions and whitelist approvals.
            </p>
          </div>
        </Link>

        <Link to="/staff/queue" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">System Administration</h3>
            <p className="text-secondary">
              Access print queue management and administrative tools.
            </p>
          </div>
        </Link>
      </div>

      {/* System Overview */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">System Overview</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-3xl mb-3">👨‍🎓</div>
            <h3 className="text-lg font-semibold mb-1">Students</h3>
            <p className="text-2xl font-bold text-primary">150+</p>
            <p className="text-secondary text-sm">Active users</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-3">👨‍🏫</div>
            <h3 className="text-lg font-semibold mb-1">Teachers</h3>
            <p className="text-2xl font-bold text-primary">25+</p>
            <p className="text-secondary text-sm">Faculty members</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="text-lg font-semibold mb-1">Print Jobs</h3>
            <p className="text-2xl font-bold text-primary">1,200+</p>
            <p className="text-secondary text-sm">This month</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold mb-1">Revenue</h3>
            <p className="text-2xl font-bold text-primary">₹15,000+</p>
            <p className="text-secondary text-sm">This month</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">👥</div>
              <div>
                <h4 className="font-medium">Teacher Approved</h4>
                <p className="text-secondary text-sm">Dr. Smith added to whitelist - 1 hour ago</p>
              </div>
              <span className="badge badge-success">Approved</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">📄</div>
              <div>
                <h4 className="font-medium">System Update</h4>
                <p className="text-secondary text-sm">Print rates configuration updated</p>
              </div>
              <span className="badge badge-warning">Modified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;