import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase/config'; 
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import styles from './Login.module.css'; // Reusing login page styles
import toast, { Toaster } from 'react-hot-toast';
import AssignmentForm from '../components/teacher/AssignmentForm'; // Import the AssignmentForm component

function TeacherSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [isApproved, setIsApproved] = useState(false); // <-- CRITICAL: isApproved state added
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  // --- NEW FUNCTION: Checks the Firestore Whitelist ---
  const handleEmailCheck = async (e) => {
    e.preventDefault();
    if (!email) return;

    // 1. Query the 'approved_teachers' collection
    const approvedCollection = collection(db, 'approved_teachers');
    const q = query(approvedCollection, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // The email is not in the whitelist
      toast.error('This email is not currently authorized for a Teacher account. Please contact an Administrator.');
      setIsApproved(false);
    } else {
      // The email is found and approved
      toast.success('Email approved! You may now set your password and assignments.');
      setIsApproved(true);
    }
  };
  // --- END NEW FUNCTION ---

  const handleAddAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
    setShowAssignmentForm(false);
  };

  const handleRemoveAssignment = (indexToRemove) => {
    setAssignments(assignments.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // CRITICAL FIX: Prevent submission if not approved
    if (!isApproved) {
      toast.error("Please approve your email first.");
      return;
    }
    if (assignments.length === 0) {
        toast.error("Please add at least one teaching assignment.");
        return;
    }
    try {
      // 1. Sign up user
      await signup(email, password, { teachingAssignments: assignments }, 'teacher'); 

      // 2. OPTIONAL: Delete the email from the approved_teachers list after successful sign-up
      const approvedQuery = query(collection(db, 'approved_teachers'), where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(approvedQuery);
      if (!snapshot.empty) {
        // Deleting the document that was just used for approval
        await deleteDoc(snapshot.docs[0].ref);
      }
      
      toast.success('Teacher account created successfully! Redirecting...');
      navigate('/teacher');
    } catch (error) {
      toast.error(error.message || 'Failed to create account.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Toaster position="top-center" />
      <h2>Create Teacher Account (Admin Approval Required)</h2>
      <form onSubmit={handleSubmit}>
        {/* === EMAIL FIELD WITH APPROVAL BUTTON === */}
        <div className={styles.formGroup} style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '10px'}}>
            <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'left'}}>
                <label>Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => {setEmail(e.target.value); setIsApproved(false);}} 
                    required 
                    disabled={isApproved} 
                />
            </div>
            {!isApproved && (
                <button 
                    type="button" 
                    onClick={handleEmailCheck} // <-- CALLS THE NEW FUNCTION
                    className={styles.submitButton}
                    style={{backgroundColor: '#ff8c00', width: 'auto', padding: '0.75rem'}}
                    disabled={!email}
                >
                    Check Approval
                </button>
            )}
            {isApproved && (
                <span style={{color: '#90EE90', fontWeight: 'bold', padding: '0.75rem', border: '1px solid #90EE90', borderRadius: '4px'}}>
                    Approved!
                </span>
            )}
        </div>
        
        {/* PASSWORD FIELD - Disabled until approved */}
        <div className={styles.formGroup}>
            <label>Password</label>
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={!isApproved} 
            />
        </div>
        
        {/* ASSIGNMENT SECTION - Only visible after approval */}
        {isApproved && (
            <div style={{ textAlign: 'left', border: '1px solid #444', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
              <h4>Teaching Assignments</h4>
              {assignments.length > 0 ? assignments.map((a, i) => (
                <div key={i} style={{ background: '#444', padding: '0.5rem', borderRadius: '5px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{a.year}yr {a.branch} {a.division} - {a.subject} ({a.batches.join(', ')})</span>
                  <button type="button" onClick={() => handleRemoveAssignment(i)} style={{background: '#c82333', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px'}}>X</button>
                </div>
              )) : <p>No assignments added yet.</p>}

              {showAssignmentForm && <AssignmentForm onAdd={handleAddAssignment} onCancel={() => setShowAssignmentForm(false)} />}
              
              {!showAssignmentForm && (
                <button type="button" onClick={() => setShowAssignmentForm(true)} style={{width: '100%', marginTop: '0.5rem', padding: '0.5rem'}}>
                  + Add New Assignment
                </button>
              )}
            </div>
        )}
        
        {/* SUBMIT BUTTON - Disabled until approved and assignments are added */}
        <button type="submit" className={styles.submitButton} disabled={!isApproved || assignments.length === 0}>
          Create Account
        </button>
      </form>
       <p style={{marginTop: '1rem'}}>Already have an account? <Link to="/login">Log In</Link></p>
    </div>
  );
}

export default TeacherSignup;