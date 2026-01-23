import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays,Link as Linkicon, Printer, CircleUser } from 'lucide-react';

function StudentDashboard() {
  return (
    <div className="container !px-8 !pt-2 pb-16">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-primary p-2">Student Dashboard</h1>
      </div>


      {/* Main Actions - ADJUSTED TO GRID-COLS-4 for wider screens */}
      <div className="grid grid-cols-2 gap-4 items-center text-secondary font-bold">
        
        {/* Schedule Action Card */}
        <Link to="/student/schedule" className="card">
          <div className="text-center p-4 items-center flex flex-col">
            <div className="text-5xl"><CalendarDays size={70} /></div>
            <h3 className="text-xl font-bold my-2">View My Schedule</h3>
            <p className="text-secondary">
              Check your class schedule, upcoming events, and academic calendar.
            </p>
          </div>
        </Link>

        {/* Print Services Action Card */}
        <Link to="/student/print" className="card">
          <div className="text-center p-4 items-center flex flex-col">
            <div className="text-5xl"><Printer size={70} /></div>
            <h3 className="text-xl font-bold my-2">Print Services</h3>
            <p className="text-secondary">
              Submit print jobs, track status, and manage your printing preferences.
            </p>
          </div>
        </Link>

        {/* V-REFER ACTION CARD */}
        <Link to="/student/v-refer" className="card">
          <div className="text-center p-4 items-center flex flex-col">
            <div className="text-5xl"><Linkicon size={70} /></div>
            <h3 className="text-xl font-bold my-2">V-Refer</h3>
            <p className="text-secondary">
              Access personalized notes and academic resources, which are updated daily.
            </p>
          </div>
        </Link>

        {/* Profile Action Card */}
        <Link to="/student/profile" className="card">
          <div className="text-center p-4 items-center flex flex-col">
            <div className="text-5xl"><CircleUser size={70} /></div>
            <h3 className="text-xl font-bold my-2">My Profile</h3>
            <p className="text-secondary">
              View and update your personal information and academic details.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      {/* <div className="my-12">
        <h2 className="text-2xl font-bold my-6">Recent Activity</h2>
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
      </div> */}
    </div>
  );
}

export default StudentDashboard;