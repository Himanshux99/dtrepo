import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, addDoc, deleteDoc, doc, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import styles from './AdminWhitelistPage.module.css';

function AdminWhitelistPage() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all approved emails
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'approved_teachers'));
      const snapshot = await getDocs(q);
      const emailList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        email: doc.data().email 
      }));
      setEmails(emailList);
    } catch (error) {
      console.error("Error fetching whitelist: ", error);
      toast.error("Failed to fetch approved emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    const emailToAdd = newEmail.trim().toLowerCase();

    if (!emailToAdd || emails.some(e => e.email === emailToAdd)) {
      toast.error('Invalid or duplicate email.');
      return;
    }

    try {
      // Check Firestore rules (Admin role) for permission to create document
      await addDoc(collection(db, 'approved_teachers'), { email: emailToAdd });
      toast.success(`${emailToAdd} added to the whitelist.`);
      setNewEmail('');
      fetchEmails(); // Refresh the list
    } catch (error) {
      console.error("Error adding email: ", error);
      toast.error("Permission denied. Ensure you are logged in as Admin.");
    }
  };

  const handleDeleteEmail = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the whitelist?`)) {
      return;
    }

    try {
      // Check Firestore rules (Admin role) for permission to delete document
      await deleteDoc(doc(db, 'approved_teachers', id));
      toast.success(`${email} removed.`);
      fetchEmails(); // Refresh the list
    } catch (error) {
      console.error("Error deleting email: ", error);
      toast.error("Permission denied. Ensure you are logged in as Admin.");
    }
  };

  if (loading) return <p>Loading Whitelist...</p>;

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />
      <h1>Manage Teacher Whitelist</h1>
      <p>Only emails on this list can sign up for a Teacher account.</p>

      {/* --- ADD NEW EMAIL FORM --- */}
      <form onSubmit={handleAddEmail} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="new-email">New Teacher Email</label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="e.g., jane.doe@vit.edu.in"
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>Add to Whitelist</button>
      </form>

      <hr />

      {/* --- WHIELIST DISPLAY --- */}
      <h2>Current Approved Emails ({emails.length})</h2>
      {emails.length === 0 ? (
        <p>No teachers are currently approved.</p>
      ) : (
        <div className={styles.listContainer}>
          {emails.map((item) => (
            <div key={item.id} className={styles.listItem}>
              <span className={styles.emailText}>{item.email}</span>
              <button 
                className={styles.deleteButton}
                onClick={() => handleDeleteEmail(item.id, item.email)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminWhitelistPage;