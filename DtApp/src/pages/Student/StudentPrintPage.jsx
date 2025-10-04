import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, runTransaction, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import styles from './StudentPrintPage.module.css';
import toast, { Toaster } from 'react-hot-toast';

// --- Slot System Configuration ---
const MAX_SLOTS = 50;
const SLOTS_PER_GROUP = 10;
const CONFIG_DOC_REF = doc(db, 'config', 'print_slots'); 

const ALLOWED_FILE_TYPES = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/jpg', 'image/gif'
];
const ACCEPT_FILE_STRING = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif';

// Helper function to convert the 0-49 index into a human-readable ID (e.g., 'A-01')
const generateSlotId = (index) => {
  const groupIndex = Math.floor(index / SLOTS_PER_GROUP);
  const slotNumber = (index % SLOTS_PER_GROUP) + 1;
  const groupLetter = String.fromCharCode(65 + groupIndex);
  
  const slotNumberPadded = String(slotNumber).padStart(2, '0');
  
  return `${groupLetter}-${slotNumberPadded}`;
};

function PrintServicePage() { 
  const { currentUser } = useAuth();

  // Form State
  const [files, setFiles] = useState([]); 
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState('B&W'); 
  const [sided, setSided] = useState('Single-Sided');
  const [isStapled, setIsStapled] = useState(false); 
  const [instructions, setInstructions] = useState(''); 
  
  // UI State
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);


  // Fetch jobs for the current user
  const fetchJobs = async () => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'print_jobs'),
      where('submittedById', '==', currentUser.uid),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    // CRITICAL FIX: Defensive rendering for job.files property
    const userJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJobs(userJobs);
  };

  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  const handleFilesChange = (e) => { // handles multiple files
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const invalidFile = selectedFiles.find(file => !ALLOWED_FILE_TYPES.includes(file.type));
    if (invalidFile) {
        toast.error(`Invalid file type: ${invalidFile.name}. Please use PDF, DOC, or common image formats.`);
        setFiles([]);
        e.target.value = null;
        return;
    }

    setFiles(selectedFiles);
  };
  
  const assignNewSlot = async () => {
    let newSlotId = null;
    
    try {
      await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(CONFIG_DOC_REF);
        
        let currentSlotIndex = 0;
        if (slotDoc.exists()) {
          currentSlotIndex = slotDoc.data().currentSlotIndex || 0;
        }
        
        const nextSlotIndex = (currentSlotIndex + 1) % MAX_SLOTS;
        newSlotId = generateSlotId(currentSlotIndex);
        
        transaction.set(CONFIG_DOC_REF, { currentSlotIndex: nextSlotIndex });
      });
      return newSlotId;
    } catch (error) {
      console.error("Transaction failed: ", error);
      return null;
    }
  };

  // NEW FUNCTION: Finds an existing active job for the current user
  const findActiveJob = async () => {
    const q = query(
        collection(db, 'print_jobs'),
        where('submittedById', '==', currentUser.uid),
        where('status', 'in', ['In Progress', 'Ready']),
        orderBy('submittedAt', 'asc') // This requires the composite index!
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) { // Check array length
      toast.error("Please select at least one file to upload.");
      return;
    }
    
    setUploading(true);
    let toastId = toast.loading(`Checking active slot and uploading ${files.length} file(s)...`);

    try {
      // Step 1: Check for existing active job
      const existingJobDoc = await findActiveJob();
      
      // Run overflow check ONLY if creating a NEW slot
      if (!existingJobDoc) {
        const activeJobsQuery = query(
          collection(db, 'print_jobs'),
          where('status', 'in', ['In Progress', 'Ready'])
        );
        const activeSnapshot = await getDocs(activeJobsQuery);

        if (activeSnapshot.size >= MAX_SLOTS) {
            toast.error(`All ${MAX_SLOTS} slots are currently active. Please ask staff to clear a slot.`, { id: toastId });
            setUploading(false);
            return;
        }
      }

      // Step 2: Upload all files sequentially and collect URLs/Names
      const uploadedFilesData = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        toast.loading(`Uploading file ${i + 1} of ${files.length}: ${file.name}`, { id: toastId });
        
        const storageRef = ref(storage, `print-jobs/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFilesData.push({
            fileName: file.name,
            fileUrl: downloadURL,
        });
      }


      if (existingJobDoc) {
        // SCENARIO 1: MERGE INTO EXISTING JOB
        const existingData = existingJobDoc.data();
        const existingFiles = existingData.files || [];
        
        // Append new files and update preferences to the latest submission
        await updateDoc(existingJobDoc.ref, {
            files: [...existingFiles, ...uploadedFilesData],
            preferences: { 
                copies: Number(copies), 
                color, 
                sided, 
                isStapled,
                instructions
            },
            submittedAt: Timestamp.now(), 
        });

        toast.success(`Slot ${existingData.slotId} updated! Added ${files.length} documents. Total: ${existingFiles.length + files.length}.`, { id: toastId });

      } else {
        // SCENARIO 2: CREATE NEW JOB
        const slotId = await assignNewSlot();
        if (!slotId) throw new Error("Failed to assign a unique slot.");
        
        const jobData = {
          submittedById: currentUser.uid, 
          submittedByEmail: currentUser.email,
          submittedByRole: currentUser.role,
          files: uploadedFilesData, 
          slotId: slotId, 
          preferences: { 
              copies: Number(copies), 
              color, 
              sided, 
              isStapled,
              instructions
          }, 
          status: 'In Progress',
          submittedAt: Timestamp.now(),
        };
        
        await addDoc(collection(db, 'print_jobs'), jobData);
        toast.success(`New job submitted! Slot ${slotId} assigned.`, { id: toastId });
      }


      // Final cleanup
      setFiles([]);
      document.getElementById('file-upload').value = null;
      setCopies(1);
      setColor('B&W');
      setSided('Single-Sided');
      setIsStapled(false);
      setInstructions('');
      fetchJobs();

    } catch (error) {
      console.error("Error submitting print job: ", error);
      toast.error(`An error occurred: ${error.message || 'Failed to submit.'}`, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return '#ffc107';
      case 'Ready': return '#28a745';
      case 'Collected': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className={styles.printContainer}>
      <Toaster position="top-center" />
      <h2>Submit a Print Job ({currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* File Upload with Multiple Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="file-upload">Documents (PDF, DOC/X, Image)</label>
          <input 
            id="file-upload" 
            type="file" 
            onChange={handleFilesChange} 
            required 
            accept={ACCEPT_FILE_STRING} 
            multiple 
          />
          {files.length > 0 && 
            <small style={{ color: '#aaa', marginTop: '5px' }}>
                {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
            </small>
          }
        </div>       

        {/* Copies */}
        <div className={styles.formGroup}>
          <label htmlFor="copies">Number of Copies</label>
          <input 
            id="copies" 
            type="number" 
            min="1" 
            value={copies} 
            onChange={(e) => setCopies(e.target.value)} 
            required 
          />
        </div>
        
        {/* Toggle Switches - Color */}
        <div className={styles.formGroup} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #555', padding: '1rem', borderRadius: '4px' }}>
            <label style={{ marginBottom: 0 }}>Color Preference</label>
            <div className={styles.toggleGroup}>
                <button 
                    type="button" 
                    onClick={() => setColor('B&W')}
                    className={color === 'B&W' ? styles.toggleActive : styles.toggleInactive}
                >
                    B&W
                </button>
                <button 
                    type="button" 
                    onClick={() => setColor('Color')}
                    className={color === 'Color' ? styles.toggleActive : styles.toggleInactive}
                >
                    Color
                </button>
            </div>
        </div>

        {/* Sided */}
        <div className={styles.formGroup}>
          <label htmlFor="sided">Sided</label>
          <select id="sided" value={sided} onChange={(e) => setSided(e.target.value)}>
            <option>Single-Sided</option>
            <option>Double-Sided</option>
          </select>
        </div>

        {/* Toggle Switches - Stapling */}
        <div className={styles.formGroup} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #555', padding: '1rem', borderRadius: '4px' }}>
            <label style={{ marginBottom: 0 }}>Stapling</label>
            <div className={styles.toggleGroup}>
                <button 
                    type="button" 
                    onClick={() => setIsStapled(false)}
                    className={!isStapled ? styles.toggleActive : styles.toggleInactive}
                >
                    No Stapling
                </button>
                <button 
                    type="button" 
                    onClick={() => setIsStapled(true)}
                    className={isStapled ? styles.toggleActive : styles.toggleInactive}
                >
                    Staple
                </button>
            </div>
        </div>
        
        {/* Instructions Field */}
        <div className={styles.formGroup}>
            <label htmlFor="instructions">More Print Instructions (Optional)</label>
            <textarea 
                id="instructions"
                rows="3"
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., 'Print pages 1-5 only', 'Bind spiral', 'High quality paper.'"
            ></textarea>
        </div>

        <button type="submit" className={styles.submitButton} disabled={uploading}>
          {uploading ? `Submitting ${files.length} file(s)...` : 'Submit Print Job'}
        </button>
      </form>

      <hr />

      <div className={styles.jobList}>
        <h2>Your Print Jobs</h2>
        {jobs.length > 0 ? (
          jobs.map(job => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobDetails}>
                
                {/* Job ID and Document Count */}
                <h3>Slot: {job.slotId} - {job.files ? job.files.length : 0} Document(s)</h3> 
                
                {/* List of Documents */}
                <p style={{ margin: '0' }}><strong>Documents:</strong></p>
                <div style={{ paddingLeft: '15px', marginBottom: '10px' }}>
                    {job.files && job.files.map((fileData, index) => ( // Defensive check
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
                    {!job.files && <span style={{color: '#dc3545'}}>File data is missing (Old Job Format).</span>}
                </div>
                
                {/* Formatted Preferences Display */}
                <div style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0' }}><strong>Copies:</strong> {job.preferences.copies || 'N/A'}</p>
                    <p style={{ margin: '0' }}><strong>Colour:</strong> {job.preferences.color || 'N/A'}</p>
                    <p style={{ margin: '0' }}><strong>Sided:</strong> {job.preferences.sided || 'N/A'}</p>
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
                
                <small style={{marginTop: '10px', display: 'block'}}>Submitted as {job.submittedByRole} on {job.submittedAt.toDate().toLocaleString()}</small>
              </div>
              
              <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(job.status) }}>
                {job.status}
              </span>

              {job.status === 'Ready' && (
                <small style={{ color: '#90EE90', fontWeight: 'bold' }}>
                  Ready for Staff Collection
                </small>
              )}
            </div>
          ))
        ) : <p>You have not submitted any print jobs yet.</p>}
      </div>
    </div>
  );
}

export default PrintServicePage;