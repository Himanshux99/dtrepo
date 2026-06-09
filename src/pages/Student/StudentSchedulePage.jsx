import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './StudentSchedulePage.module.css';

function StudentSchedulePage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFilteredEvents = async () => {
      try {
        // 1. Fetch the student's user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error("Could not find user profile.");
        }
        
        const userData = userDoc.data();
        // 2. Decode their roll number to get class details
        const studentDetails = decodeRollNumber(userData.rollNumber, userData.email);

        if (studentDetails.error) {
            throw new Error(studentDetails.error);
        }

        // 3. Build the targeted Firestore query
        const updatesCollection = collection(db, 'lecture_updates');
        const q = query(
          updatesCollection,
          where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
          where('classInfo.branch', '==', studentDetails.branchShortName),
          where('classInfo.division', '==', studentDetails.division)
        );

        // 4. Fetch the filtered updates
        const querySnapshot = await getDocs(q);
        const formattedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.classInfo.subject, // Use the new data structure
            start: data.eventDate.toDate(),
            extendedProps: {
              type: data.updateType,
              message: data.message,
            }
          };
        });
        
        setEvents(formattedEvents);

      } catch (error) {
        console.error("Error fetching filtered events: ", error);
        toast.error(error.message || "Could not fetch schedule updates.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredEvents();
  }, [currentUser]);

  const handleEventClick = (clickInfo) => {
    const { title, extendedProps } = clickInfo.event;
    const message = `
      <div style="text-align: left;">
        <strong>Type:</strong> ${extendedProps.type}<br/>
        <strong>Message:</strong> ${extendedProps.message}
      </div>
    `;
    toast.custom((t) => (
      <div
        style={{
          background: '#333', color: '#fff', padding: '16px',
          borderRadius: '8px', border: '1px solid #555',
          opacity: t.visible ? 1 : 0, transition: 'opacity 300ms',
        }}
      >
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #555', paddingBottom: '8px' }}>{title}</h3>
        <div dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    ));
  };

  if (loading) {
    return <p>Loading Your Personalized Schedule...</p>;
  }

  return (
    <div className={styles.scheduleContainer}>
      <Toaster position="bottom-center" />
      <h1>Your Schedule & Updates</h1>
      <FullCalendar
        plugins={[listPlugin, interactionPlugin]}
        initialView="listWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'listDay,listWeek,listMonth'
        }}
        buttonText={{ listDay: 'Day', listWeek: 'Week', listMonth: 'Month' }}
        events={events}
        eventClick={handleEventClick}
        noEventsText="No lectures or updates scheduled for your class."
        height="auto"
      />
    </div>
  );
}

export default StudentSchedulePage;