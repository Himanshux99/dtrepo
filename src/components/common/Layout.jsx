import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import styles from "./Layout.module.css"; // Import a new CSS module
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";

function Layout() {
  return (
    // make layout a column so footer is pushed to the bottom
    <div className="min-h-screen flex justify-center">
      <Navbar />
      {/* This main tag will wrap every page and apply consistent padding */}
      <main className={`flex w-full justify-center items-center pt-[70px]`}>
        <Outlet /> {/* Your page components render here */}
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--bg-secondary)",
            color: "black",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
          },
        }}
      />
      <Footer />
    </div>
  );
}

export default Layout;
