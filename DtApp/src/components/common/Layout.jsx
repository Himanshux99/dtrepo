import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import styles from './Layout.module.css'; // Import a new CSS module

function Layout() {
  return (
    <>
      <Navbar />
      {/* This main tag will wrap every page and apply consistent padding */}
      <main className={styles.mainContent}>
        <Outlet /> {/* Your page components render here */}
      </main>
    </>
  );
}

export default Layout;