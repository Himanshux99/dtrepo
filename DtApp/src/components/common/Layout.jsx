import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

function Layout() {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <main className="pt-20"> {/* Add padding to avoid content being hidden by the fixed navbar */}
        <Outlet /> {/* Child routes will be rendered here */}
      </main>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          },
        }}
      />
    </div>
  );
}

export default Layout;