import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import styles from './PostUpdatePage.module.css'; // Reusing styles
import toast, { Toaster } from 'react-hot-toast';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ManageSchedulePage() {
  const { currentUser } = useAuth();
  
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [venue, setVenue] = useState('');

  const fetchSchedulesAndAssignments = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch assignments to populate the dropdown
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().teachingAssignments) {
        setTeachingAssignments(userDoc.data().teachingAssignments);
      }

      // Fetch existing schedules
      const schedulesCollection = collection(db, 'schedules');
      const q = query(schedulesCollection, where('teacherId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const schedulesData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(schedulesData);

    } catch (error) {
      toast.error("Failed to fetch data.");
      console.error(error);
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchSchedulesAndAssignments();
  }, [fetchSchedulesAndAssignments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAssignmentIndex === '' || !venue) {
      toast.error("Please select a class and enter a venue.");
      return;
    }

    const selectedAssignment = teachingAssignments[selectedAssignmentIndex];
    const newScheduleEntry = {
      teacherId: currentUser.uid,
      classInfo: { ...selectedAssignment },
      dayOfWeek: parseInt(dayOfWeek, 10), // Store as number 0-6
      startTime, // Store as "HH:mm"
      endTime,
      venue,
    };

    try {
      await addDoc(collection(db, 'schedules'), newScheduleEntry);
      toast.success("Schedule added successfully!");
      fetchSchedulesAndAssignments(); // Refresh list
    } catch (error) {
      toast.error("Failed to add schedule.");
      console.error(error);
    }
  };
  
  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled class?")) return;
    try {
        await deleteDoc(doc(db, 'schedules', scheduleId));
        toast.success("Schedule deleted!");
        fetchSchedulesAndAssignments(); // Refresh list
    } catch (error) {
        toast.error("Failed to delete schedule.");
        console.error(error);
    }
  };

  return (
    <div className={styles.updateContainer}>
      <Toaster position="top-center" />
      <h2>Manage Weekly Schedule</h2>
      <p>Add your fixed, recurring weekly classes here.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Select Class</label>
          <select value={selectedAssignmentIndex} onChange={(e) => setSelectedAssignmentIndex(e.target.value)} required>
            <option value="" disabled>-- Select a class --</option>
            {teachingAssignments.map((a, index) => (
              <option key={index} value={index}>
                {a.year} Year {a.branch} (Div {a.division}) - {a.subject}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
          <div className={styles.formGroup}>
            <label>Day of Week</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Start Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className={styles.formGroup}>
            <label>Venue / Room No.</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g., Room 501 / Online" required/>
        </div>

        <button type="submit" className={styles.submitButton}>Add to Schedule</button>
      </form>

      <hr/>
      <h2>Your Current Schedule</h2>
      <div className={styles.updateList}>
        {loading ? <p>Loading...</p> : schedules.map(s => (
            <div key={s.id} className={styles.updateCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3>{s.classInfo.subject}</h3>
                    <button onClick={() => handleDelete(s.id)} style={{background: '#c82333', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem'}}>Delete</button>
                </div>
                <p>{s.classInfo.year} Year {s.classInfo.branch} (Div {s.classInfo.division})</p>
                <p><strong>Every {DAYS_OF_WEEK[s.dayOfWeek]}</strong> from {s.startTime} to {s.endTime} in <strong>{s.venue}</strong></p>
            </div>
        ))}
        {schedules.length === 0 && !loading && <p>You have not added any recurring classes to your schedule yet.</p>}
      </div>
    </div>
  );
}

export default ManageSchedulePage;