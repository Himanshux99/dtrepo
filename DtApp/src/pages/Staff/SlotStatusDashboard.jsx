import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import styles from './SlotStatusDashboard.module.css';
import toast from 'react-hot-toast';

// Slot System Configuration (Must match PrintServicePage)
const MAX_SLOTS = 40;
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
      case 'Empty': return "bg-gray-700 border-gray-400";
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
    <div className="w-[80%] pb-16 mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-primary mb-2">
        Print Slot Status Dashboard
      </h1>
      <div className='bg-white p-2 rounded-lg text-xl flex font-bold items-center justify-between px-8'>
        <p className="text-secondary">
          Total Slots: {MAX_SLOTS}. Active: {slotMap.filter(s => s.isActive).length}. Empty: {slotMap.filter(s => !s.isActive).length}.
        </p>

        {/* Refresh Button */}
        <button
          onClick={fetchSlotStatus}
          className="bg-primary hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all"
        >
          Refresh Status
        </button>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 my-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-gray-200 rounded-full border"></span>
          Empty
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-yellow-400 rounded-full border"></span>
          In Progress
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full border"></span>
          Ready for Pickup
        </div>
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-2 gap-10 w-full">
        {Object.entries(groupedSlots).map(([group, slots]) => (
          <div key={group} className="bg-secondary p-4 rounded-lg shadow-md">
            <h2 className="text-xl !font-bold !text-primary mb-4">Group {group}</h2>
            <div className='grid grid-cols-5 gap-2'>
              {slots.map(slot => (
                <div key={slot.id} className="flex flex-col items-center ">
                  <div
                    className={`w-full pt-1 flex flex-col items-center justify-center rounded-lg font-bold text-white shadow ${getSlotClass(slot.status)}`}
                    title={slot.jobData ? `Job: ${slot.jobData.fileName} by ${slot.jobData.submittedByEmail}` : 'Empty'}
                  >
                    {slot.id}
                    {slot.status != 'In Progress' && slot.status != 'Ready' && (
                      <button
                        className="w-full mt-1 bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded-md text-sm font-semibold shadow transition-all"
  
                      >
                        Empty
                      </button>
                    )}
                    {slot.status === 'In Progress' && (
                      <button
                        className="w-full mt-1 bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-semibold shadow transition-all"
                        onClick={() => updateJobStatus(slot.jobData.id, 'Ready', slot.id)}
                        title="Mark as Printed"
                      >
                        Print
                      </button>
                    )}
                    {slot.status === 'Ready' && (
                      <button
                        className="w-full mt-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-sm font-semibold shadow transition-all"
                        onClick={() => updateJobStatus(slot.jobData.id, 'Collected', slot.id)}
                        title="Mark as Collected"
                      >
                        Collect
                      </button>
                    )}
                  </div>

                  {/* STATUS BUTTONS */}

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