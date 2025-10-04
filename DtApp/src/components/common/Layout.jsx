import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

import { Toaster } from 'react-hot-toast';

function Layout() {
  return (
    <>
    <Toaster position="top-center" />
      <Navbar />
      <main style={{ paddingTop: '80px' }}> {/* Add padding to avoid content being hidden by the fixed navbar */}
        <Outlet /> {/* Child routes will be rendered here */}
      </main>
    </>
  );
}

export default Layout;