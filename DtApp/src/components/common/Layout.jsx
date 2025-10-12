import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import styles from './Layout.module.css'; // Import a new CSS module
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

function Layout() {
  return (
    <>
      <Navbar />
      {/* This main tag will wrap every page and apply consistent padding */}
      <main className={styles.mainContent}>
        <Outlet /> {/* Your page components render here */}
      </main>
      <Footer />
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