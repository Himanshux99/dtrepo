import React from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Printer,
  HandCoins,
  FileText,
  CircleCheck,
  CircleDot,
  Pencil
} from "lucide-react";

function StaffDashboard() {
  return (
    <div className="container !px-4 pb-16">
      {/* Header */}
      <div className="my-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Staff Dashboard</h1>
        <p className="text-primary text-lg">
          Manage print services and system operations
        </p>
      </div>

      {/* Quick Stats */}
      {/* <div className="grid md:grid-cols-3 gap-6 mb-8 text-secondary font-bold border-b-4 pb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              <ClipboardList size={35} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Print Queue</h3>
              <p className="text-secondary text-sm">Manage print jobs</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              <Printer size={35} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Print Slots</h3>
              <p className="text-secondary text-sm">Monitor slot status</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              <HandCoins size={35} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Rates</h3>
              <p className="text-secondary text-sm">Manage pricing</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-secondary border-b-4 pb-8">
        <Link
          to="/staff/queue"
          className="card px-4 font-bold hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="text-center flex flex-col items-center">
            <div className="text-5xl mb-4">
              <ClipboardList size={45} />
            </div>
            <h3 className="text-xl mb-2">Print Queue Management</h3>
            <p className="text-secondary ">
              View, process, and manage all print jobs in the system.
            </p>
          </div>
        </Link>

        <Link
          to="/staff/slots"
          className="card px-4 font-bold hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="text-center flex flex-col items-center">
            <div className="text-5xl mb-4">
              <Printer size={45} />
            </div>
            <h3 className="text-xl mb-2">Print Slot Status</h3>
            <p className="text-secondary ">
              Monitor print slot availability and current job status.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/rates"
          className="card px-4 font-bold hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="text-center flex flex-col items-center">
            <div className="text-5xl mb-4">
              <HandCoins size={45} />
            </div>
            <h3 className="text-xl mb-2">Manage Print Rates</h3>
            <p className="text-secondary ">
              Configure pricing for different print options and services.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="mt-4 text-secondary font-bold">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          Recent Activity
        </h2>
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 bg-tertiary rounded-lg">
              <div className="flex items-center gap-4">
                <FileText size={30} />
                <div>
                  <h4 className="font-bold text-md">Print Job Processed</h4>
                  <p className="text-secondary text-sm">
                    Job A-01 <br></br>2 hours ago
                  </p>
                </div>
              </div>
              <div className="badge badge-success">
                <CircleCheck size={30} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 bg-tertiary rounded-lg">
              <div className="flex items-center gap-4">
                <Pencil size={30} />
                <div>
                  <h4 className="font-bold text-md">Rates Updated</h4>
                  <p className="text-secondary text-sm">
                    Color printing <br></br>rates adjusted
                  </p>
                </div>
              </div>
              <div className="badge badge-warning">
                <CircleDot size={30} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
