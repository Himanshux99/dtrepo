import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './StudentSchedulePage.module.css';

function StudentSchedulePage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

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
        
        // 5. Fetch updates for the Updates tab
        const updatesQuery = query(
          updatesCollection,
          where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
          where('classInfo.branch', '==', studentDetails.branchShortName),
          where('classInfo.division', '==', studentDetails.division),
          orderBy('createdAt', 'desc')
        );
        
        const updatesSnapshot = await getDocs(updatesQuery);
        const formattedUpdates = updatesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            subject: data.classInfo.subject,
            updateType: data.updateType,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            eventDate: data.eventDate?.toDate(),
            teacherName: data.teacherName || 'Unknown Teacher'
          };
        });
        
        setUpdates(formattedUpdates);

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
    <div className="container mx-auto px-4 py-8">
      <Toaster position="bottom-center" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Your Schedule & Updates</h1>
        <p className="text-secondary">View your class schedule and teacher updates</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-color mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'schedule'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          📅 Schedule
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'updates'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          📢 Updates
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="card">
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
      )}

      {activeTab === 'updates' && (
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-lg font-semibold mb-2">No Updates Yet</h3>
              <p className="text-secondary">Your teachers haven't posted any updates yet.</p>
            </div>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {update.updateType === 'cancellation' ? '❌' : 
                       update.updateType === 'reschedule' ? '🔄' : 
                       update.updateType === 'assignment' ? '📝' : '📢'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{update.subject}</h3>
                      <p className="text-secondary text-sm">
                        by {update.teacherName} • {update.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${
                    update.updateType === 'cancellation' ? 'badge-error' :
                    update.updateType === 'reschedule' ? 'badge-warning' :
                    update.updateType === 'assignment' ? 'badge-primary' : 'badge-secondary'
                  }`}>
                    {update.updateType}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-primary">{update.message}</p>
                </div>
                
                {update.eventDate && (
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <span>📅</span>
                    <span>Event Date: {update.eventDate.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default StudentSchedulePage;