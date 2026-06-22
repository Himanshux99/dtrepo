import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // This effect runs when the component loads or when currentUser changes.
  useEffect(() => {
    // If a user is logged in, redirect them to their dashboard.
    if (currentUser && currentUser.role) {
      switch (currentUser.role) {
        case 'student':
          navigate('/student', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher', { replace: true });
          break;
        case 'staff':
          navigate('/staff', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          // Stay on the home page if the role is unknown
          break;
      }
    }
  }, [currentUser, navigate]);

  // While the check is happening, or if there's no user, show the public home page.
  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
              College Portal
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8">
              Your comprehensive platform for academic management, printing services, and more.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Student Services</h3>
              <p className="text-secondary">
                Access your schedule, submit print jobs, and manage your academic profile.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold mb-2">Teacher Tools</h3>
              <p className="text-secondary">
                Manage your schedule, post updates, and access teaching resources.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-4">🖨️</div>
              <h3 className="text-xl font-semibold mb-2">Print Services</h3>
              <p className="text-secondary">
                Submit print jobs, track status, and manage printing preferences.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-outline btn-lg">
              Create Account
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-secondary mb-4">
              New to the platform? Choose your role:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="btn btn-secondary">
                Student Registration
              </Link>
              <Link to="/signup/teacher" className="btn btn-secondary">
                Teacher Registration
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-secondary">
              Streamlined academic management for students, teachers, and staff.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">Schedule Management</h3>
              <p className="text-secondary text-sm">
                View and manage your academic schedule with ease.
              </p>
            </div>

            <div className="card">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="text-lg font-semibold mb-2">Print Services</h3>
              <p className="text-secondary text-sm">
                Submit and track your print jobs with real-time status updates.
              </p>
            </div>

            <div className="card">
              <div className="text-3xl mb-4">👤</div>
              <h3 className="text-lg font-semibold mb-2">Profile Management</h3>
              <p className="text-secondary text-sm">
                Keep your academic profile up to date and secure.
              </p>
            </div>

            <div className="card">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
              <p className="text-secondary text-sm">
                Role-based access control ensures data security and privacy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;