import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebase/config'; 
import { collection, query, where, getDocs, updateDoc, doc, orderBy, deleteDoc, Timestamp } from 'firebase/firestore'; 
import { ref, deleteObject } from 'firebase/storage'; 
import { useAuth } from '../../context/AuthContext'; 
import styles from './StaffPrintQueuePage.module.css';
import toast, { Toaster } from 'react-hot-toast';

// Define 24 hours in milliseconds (for the client-side cleanup proxy)
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; 

function StaffPrintQueuePage() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('In Progress'); 

  // Function to perform cleanup (1-Day Auto-Deletion Logic)
  const cleanupOldJobs = useCallback(async () => {
    // 1. Query for all COLLECTED jobs
    const collectedQuery = query(
      collection(db, 'print_jobs'),
      where('status', '==', 'Collected')
    );
    const collectedSnapshot = await getDocs(collectedQuery);

    let jobsDeleted = 0;
    
    collectedSnapshot.docs.forEach(async (doc) => {
      const data = doc.data();
      
      // Check if the job's collection time is older than 24 hours
      if (data.submittedAt && (Timestamp.now().toMillis() - data.submittedAt.toMillis() > ONE_DAY_IN_MS)) {
        
        try {
          // DELETE ALL FILES in the job
          data.files.forEach(async (fileData) => {
              const storagePath = fileData.fileUrl.split('/o/')[1].split('?alt=media')[0];
              const decodedPath = decodeURIComponent(storagePath);
              const fileRef = ref(storage, decodedPath);
              await deleteObject(fileRef);
          });

          // Delete document from Firestore
          await deleteDoc(doc.ref);
          jobsDeleted++;
        } catch (error) {
          console.error(`Failed to delete old job/file: ${doc.id}`, error);
        }
      }
    });

    if (jobsDeleted > 0) {
      toast.success(`${jobsDeleted} old print slots cleared!`);
    }
  }, []); 

  
  // Fetch ALL jobs and filter them based on the active tab
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Run Cleanup first
      await cleanupOldJobs();
      
      // Step 2: Fetch ALL jobs 
      const q = query(
        collection(db, 'print_jobs'),
        orderBy('submittedAt', 'asc')
      );
      const querySnapshot = await getDocs(q);

      const allJobs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      setJobs(allJobs);
      toast.success(`Total print jobs fetched: ${allJobs.length}.`, { duration: 1500 });

    } catch (error) {
      console.error('Error fetching print jobs: ', error);
      toast.error('Failed to fetch print queue.');
    } finally {
      setLoading(false);
    }
  }, [cleanupOldJobs]);


  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);


  const updateJobStatus = async (jobId, newStatus) => {
    const jobRef = doc(db, 'print_jobs', jobId);
    const action = newStatus === 'Ready' ? 'marking as ready' : 'marking as collected';
    const successMsg = newStatus === 'Ready'
      ? `Job ${jobId} marked as READY for pickup!`
      : `Job ${jobId} marked as COLLECTED and slot emptied.`;

    try {
      await updateDoc(jobRef, { status: newStatus });
      toast.success(successMsg);
      fetchJobs();
    } catch (error) {
      console.error(`Error ${action}: `, error);
      toast.error(`Failed to update job status: ${jobId}`);
    }
  };

  const deleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to permanently delete job ${job.slotId} (${job.id})? This action cannot be undone and slot will be cleared.`)) {
      return;
    }

    const toastId = toast.loading(`Deleting job ${job.slotId}...`);

    try {
      // 1. Delete ALL files from Firebase Storage
      job.files.forEach(async (fileData) => {
          const storagePath = fileData.fileUrl.split('/o/')[1].split('?alt=media')[0];
          const decodedPath = decodeURIComponent(storagePath);
          const fileRef = ref(storage, decodedPath);
          await deleteObject(fileRef);
      });

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, 'print_jobs', job.id));

      toast.success(`Job ${job.slotId} and associated files deleted successfully!`, { id: toastId });
      fetchJobs();

    } catch (error) {
      console.error('Error deleting print job: ', error);
      toast.error(`Failed to delete job ${job.slotId}. Check console for details.`, { id: toastId });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return '#ffc107'; // Yellow
      case 'Ready': return '#28a745'; // Green
      case 'Collected': return '#6c757d'; // Gray
      default: return '#6c757d';
    }
  };

  // Client-side filtering based on the selected tab
  const filteredJobs = jobs.filter(job => job.status === activeTab);


  if (loading) {
    return <p>Loading Print Queue...</p>;
  }

  return (
    <div className={styles.queueContainer}>
      <Toaster position="top-center" />
      <h1>Staff Print Queue</h1>
      <p>Slot Code is the unique ID for job collection.</p>
      
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button 
          className={activeTab === 'In Progress' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('In Progress')}
        >
          In Progress ({jobs.filter(j => j.status === 'In Progress').length})
        </button>
        <button 
          className={activeTab === 'Ready' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('Ready')}
        >
          Ready to Collect ({jobs.filter(j => j.status === 'Ready').length})
        </button>
        <button 
          className={activeTab === 'Collected' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('Collected')}
        >
          Collected ({jobs.filter(j => j.status === 'Collected').length})
        </button>
      </div>


      {filteredJobs.length === 0 && <p className={styles.noJobs}>No jobs currently in the "{activeTab}" status.</p>}

      <div className={styles.jobList}>
        {filteredJobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.jobDetails}>
              <h3>Slot ID: <span className={styles.jobId}>{job.slotId}</span></h3>
              <p><strong>Submitted By:</strong> {job.submittedByEmail} ({job.submittedByRole})</p>
              
              {/* File Display - Show List of Documents */}
              <p style={{ margin: '0' }}><strong>Documents ({job.files.length}):</strong></p>
              <div style={{ paddingLeft: '15px', marginBottom: '10px' }}>
                  {job.files.map((fileData, index) => (
                      <a 
                          key={index} 
                          href={fileData.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ display: 'block', color: '#90EE90', textDecoration: 'underline', fontSize: '0.9em' }}
                          title={`Click to view ${fileData.fileName}`}
                      >
                          {index + 1}. {fileData.fileName}
                      </a>
                  ))}
              </div>

              {/* Preferences Display (Formatted) */}
              <div style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: '0' }}><strong>Copies:</strong> {job.preferences.copies}</p>
                  <p style={{ margin: '0' }}><strong>Colour:</strong> {job.preferences.color}</p>
                  <p style={{ margin: '0' }}><strong>Sided:</strong> {job.preferences.sided}</p>
                  <p style={{ margin: '0' }}><strong>Stapling:</strong> {job.preferences.isStapled ? 'Yes' : 'No'}</p>

                  {job.preferences.instructions && (
                      <div style={{ marginTop: '0.5rem', borderLeft: '3px solid #007bff', paddingLeft: '5px' }}>
                          <strong style={{ display: 'block' }}>Instructions:</strong>
                          <span style={{ fontStyle: 'italic', color: '#87CEEB' }}>
                              {job.preferences.instructions}
                          </span>
                      </div>
                  )}
              </div>
              <small style={{marginTop: '10px', display: 'block'}}>Submitted At: {job.submittedAt.toDate().toLocaleString()}</small>
            </div>

            <div className={styles.jobActions}>
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(job.status) }}
              >
                {job.status}
              </span>

              {/* Action: Mark as Ready (Only shown on 'In Progress' tab) */}
              {job.status === 'In Progress' && (
                <button
                  className={styles.readyButton}
                  onClick={() => updateJobStatus(job.id, 'Ready')}
                >
                  Mark Printed (Ready)
                </button>
              )}

              {/* Action: Mark as Collected (Only shown on 'Ready' tab) */}
              {job.status === 'Ready' && ( 
                 <button
                  className={styles.collectedButton}
                  onClick={() => updateJobStatus(job.id, 'Collected')}
                >
                  Mark Collected (Empty Slot)
                </button>
              )}
              
              {/* Delete Job Button (Visible on all tabs) */}
              {currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin') && (
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteJob(job)}
                  style={{marginTop: '1rem'}} 
                >
                  Delete Job
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={fetchJobs} className={styles.refreshButton}>Refresh Queue</button>
    </div>
  );
}

export default StaffPrintQueuePage;