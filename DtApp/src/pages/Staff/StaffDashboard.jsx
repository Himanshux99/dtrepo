import React from 'react';
import { Link } from 'react-router-dom';

function StaffDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Staff Dashboard</h1>
        <p className="text-secondary">Manage print services and system operations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📋</div>
            <div>
              <h3 className="text-lg font-semibold">Print Queue</h3>
              <p className="text-secondary text-sm">Manage print jobs</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🖨️</div>
            <div>
              <h3 className="text-lg font-semibold">Print Slots</h3>
              <p className="text-secondary text-sm">Monitor slot status</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">💰</div>
            <div>
              <h3 className="text-lg font-semibold">Rates</h3>
              <p className="text-secondary text-sm">Manage pricing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/staff/queue" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Print Queue Management</h3>
            <p className="text-secondary">
              View, process, and manage all print jobs in the system.
            </p>
          </div>
        </Link>

        <Link to="/staff/slots" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">🖨️</div>
            <h3 className="text-xl font-semibold mb-2">Print Slot Status</h3>
            <p className="text-secondary">
              Monitor print slot availability and current job status.
            </p>
          </div>
        </Link>

        <Link to="/admin/rates" className="card hover:transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Manage Print Rates</h3>
            <p className="text-secondary">
              Configure pricing for different print options and services.
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
                <h4 className="font-medium">Print Job Processed</h4>
                <p className="text-secondary text-sm">Job A-01 completed - 2 hours ago</p>
              </div>
              <span className="badge badge-success">Completed</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-tertiary rounded-lg">
              <div className="text-2xl">💰</div>
              <div>
                <h4 className="font-medium">Rates Updated</h4>
                <p className="text-secondary text-sm">Color printing rates adjusted</p>
              </div>
              <span className="badge badge-warning">Modified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;