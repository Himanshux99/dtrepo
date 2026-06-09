import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import styles from './SlotStatusDashboard.module.css';
import toast from 'react-hot-toast';

// Slot System Configuration (Must match PrintServicePage)
const MAX_SLOTS = 50;
const SLOTS_PER_GROUP = 10;
const generateSlotId = (index) => {
  const groupIndex = Math.floor(index / SLOTS_PER_GROUP);
  const slotNumber = (index % SLOTS_PER_GROUP) + 1;
  const groupLetter = String.fromCharCode(65 + groupIndex);
  return `${groupLetter}-${String(slotNumber).padStart(2, '0')}`;
};

function SlotStatusDashboard() {
  const [slotMap, setSlotMap] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch active jobs and build the map
  const fetchSlotStatus = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all currently active (In Progress or Ready) print jobs
      const q = query(
        collection(db, 'print_jobs'),
        where('status', 'in', ['In Progress', 'Ready'])
      );
      const querySnapshot = await getDocs(q);

      const activeSlots = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        activeSlots[data.slotId] = {
            id: doc.id, // Store Firestore doc ID for update
            ...data
        };
      });

      // 2. Map all 50 possible slots
      const fullSlotMap = Array.from({ length: MAX_SLOTS }, (_, index) => {
        const slotId = generateSlotId(index);
        const isActive = !!activeSlots[slotId];
        
        return {
          id: slotId,
          isActive: isActive,
          status: isActive ? activeSlots[slotId].status : 'Empty',
          jobData: isActive ? activeSlots[slotId] : null
        };
      });

      setSlotMap(fullSlotMap);

    } catch (error) {
      console.error('Error fetching slot status: ', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlotStatus();
  }, [fetchSlotStatus]);

  // NEW FUNCTION: Status Update Logic (Copied from StaffPrintQueuePage)
  const updateJobStatus = async (jobId, newStatus, slotId) => {
    const jobRef = doc(db, 'print_jobs', jobId);
    const successMsg = newStatus === 'Ready'
      ? `Slot ${slotId} marked as READY for pickup!`
      : `Slot ${slotId} marked as COLLECTED and slot emptied.`;

    try {
      await updateDoc(jobRef, { status: newStatus });
      toast.success(successMsg);
      fetchSlotStatus(); // Refresh the dashboard state
    } catch (error) {
      console.error(`Error updating job status: `, error);
      toast.error(`Failed to update slot ${slotId}.`);
    }
  };


  // Function to determine the CSS class based on slot status
  const getSlotClass = (status) => {
    switch (status) {
      case 'Empty': return styles.slotEmpty;
      case 'In Progress': return styles.slotInProgress;
      case 'Ready': return styles.slotReady;
      default: return styles.slotEmpty;
    }
  };

  if (loading) return <p>Loading Slot Status...</p>;

  // Function to group slots by letter (A, B, C, D, E)
  const groupedSlots = slotMap.reduce((acc, slot) => {
    const group = slot.id.charAt(0);
    if (!acc[group]) acc[group] = [];
    acc[group].push(slot);
    return acc;
  }, {});


  return (
    <div className={styles.dashboardContainer}>
      <h1>Print Slot Status Dashboard</h1>
      <p>Total Slots: {MAX_SLOTS}. Active: {slotMap.filter(s => s.isActive).length}. Empty: {slotMap.filter(s => !s.isActive).length}.</p>
      
      <button onClick={fetchSlotStatus} className={styles.refreshButton}>Refresh Status</button>

      <div className={styles.statusLegend}>
        <div className={`${styles.slotCard} ${styles.slotEmpty}`}>Empty</div>
        <div className={`${styles.slotCard} ${styles.slotInProgress}`}>In Progress</div>
        <div className={`${styles.slotCard} ${styles.slotReady}`}>Ready for Pickup</div>
      </div>

      <div className={styles.slotGridContainer}>
        {Object.entries(groupedSlots).map(([group, slots]) => (
          <div key={group} className={styles.slotGroup}>
            <h2>Group {group}</h2>
            <div className={styles.slotGroupGrid}>
              {slots.map(slot => (
                // Use a different container to allow space for buttons
                <div key={slot.id} className={styles.slotWrapper}>
                    <div 
                      className={`${styles.slotCard} ${getSlotClass(slot.status)}`}
                      title={slot.jobData ? `Job: ${slot.jobData.fileName} by ${slot.jobData.submittedByEmail}` : 'Empty'}
                    >
                      {slot.id}
                    </div>

                    {/* STATUS BUTTONS integrated here */}
                    {slot.status === 'In Progress' && (
                        <button
                            className={styles.actionReadyButton} // New CSS class required
                            onClick={() => updateJobStatus(slot.jobData.id, 'Ready', slot.id)}
                            title="Mark as Printed"
                        >
                            Print
                        </button>
                    )}
                    {slot.status === 'Ready' && (
                        <button
                            className={styles.actionCollectButton} // New CSS class required
                            onClick={() => updateJobStatus(slot.jobData.id, 'Collected', slot.id)}
                            title="Mark as Collected"
                        >
                            Collect
                        </button>
                    )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlotStatusDashboard;