import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './StudentSchedulePage.module.css';

const updateTypes = [
    { type: 'Scheduled', color: '#3788d8' },
    { type: 'Cancelled', color: '#dc3545' },
    { type: 'Venue Change', color: '#ffc107' },
    { type: 'Delayed', color: '#fd7e14' },
    { type: 'Substitute', color: '#17a2b8' }
];

const getColorForUpdate = (updateType) => {
    const found = updateTypes.find(t => t.type === updateType);
    return found ? found.color : '#007bff';
};

function StudentSchedulePage() {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAndProcessSchedules = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error("Could not find user profile.");
            
            const studentDetails = decodeRollNumber(userDoc.data().rollNumber, userDoc.data().email);
            if (studentDetails.error) throw new Error(studentDetails.error);

            const schedulesQuery = query(
                collection(db, 'schedules'),
                where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
                where('classInfo.branch', '==', studentDetails.branchShortName),
                where('classInfo.division', '==', studentDetails.division)
            );
            const updatesQuery = query(
                collection(db, 'lecture_updates'),
                where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
                where('classInfo.branch', '==', studentDetails.branchShortName),
                where('classInfo.division', '==', studentDetails.division)
            );

            const [schedulesSnapshot, updatesSnapshot] = await Promise.all([
                getDocs(schedulesQuery),
                getDocs(updatesQuery),
            ]);
            
            const scheduleRules = schedulesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const singleUpdates = updatesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            const finalEvents = generateAndMergeSchedules(scheduleRules, singleUpdates);
            setEvents(finalEvents);

        } catch (error) {
            console.error("Error fetching schedule: ", error);
            toast.error(error.message || "Could not fetch schedule.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAndProcessSchedules();
    }, [fetchAndProcessSchedules]);
    
    const handleEventClick = (clickInfo) => {
        const { title, extendedProps } = clickInfo.event;
        const message = `
          <div style="text-align: left;">
              <strong>Type:</strong> ${extendedProps.type}<br/>
              ${extendedProps.venue ? `<strong>Venue:</strong> ${extendedProps.venue}<br/>` : ''}
              <strong>Message:</strong> ${extendedProps.message}
          </div>
        `;

        toast.custom((t) => (
          <div
            className={`${styles.toastContainer} ${t.visible ? styles.toastEnter : styles.toastLeave}`}
          >
            <h3 className={styles.toastHeader}>{title}</h3>
            <div dangerouslySetInnerHTML={{ __html: message }} />
          </div>
        ));
    };

    const generateAndMergeSchedules = (rules, updates) => {
        const generatedEvents = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 60);

        const updatesMap = new Map();
        updates.forEach(upd => {
            const eventDateStr = upd.eventDate.toDate().toISOString().split('T')[0];
            const key = `${eventDateStr}_${upd.classInfo.subject}`;
            updatesMap.set(key, upd);
        });

        for (let day = new Date(today); day <= endDate; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            rules.forEach(rule => {
                if (rule.dayOfWeek === dayOfWeek) {
                    const [startHour, startMinute] = rule.startTime.split(':');
                    const [endHour, endMinute] = rule.endTime.split(':');
                    
                    const startDate = new Date(day);
                    startDate.setHours(startHour, startMinute, 0, 0);

                    const ruleEndDate = new Date(day);
                    ruleEndDate.setHours(endHour, endMinute, 0, 0);

                    const eventDateStr = day.toISOString().split('T')[0];
                    const key = `${eventDateStr}_${rule.classInfo.subject}`;
                    
                    const overrideUpdate = updatesMap.get(key);

                    if (overrideUpdate) {
                        generatedEvents.push({
                            id: `update-${overrideUpdate.id}`,
                            title: `${rule.classInfo.subject}`,
                            start: overrideUpdate.eventDate.toDate(),
                            end: ruleEndDate,
                            backgroundColor: getColorForUpdate(overrideUpdate.updateType),
                            borderColor: getColorForUpdate(overrideUpdate.updateType),
                            extendedProps: {
                                type: overrideUpdate.updateType,
                                message: overrideUpdate.message,
                                venue: overrideUpdate.updateType === 'Venue Change' ? overrideUpdate.message : rule.venue,
                            }
                        });
                        updatesMap.delete(key);
                    } else {
                        generatedEvents.push({
                            id: `schedule-${rule.id}-${eventDateStr}`,
                            title: `${rule.classInfo.subject}`,
                            start: startDate,
                            end: ruleEndDate,
                            backgroundColor: getColorForUpdate('Scheduled'),
                            borderColor: getColorForUpdate('Scheduled'),
                            extendedProps: { 
                                type: 'Scheduled', 
                                message: `Regularly scheduled class in ${rule.venue}`, 
                                venue: rule.venue 
                            }
                        });
                    }
                }
            });
        }

        updatesMap.forEach(upd => {
            generatedEvents.push({
                id: `update-${upd.id}`,
                title: `${upd.classInfo.subject}`,
                start: upd.eventDate.toDate(),
                backgroundColor: getColorForUpdate(upd.updateType),
                borderColor: getColorForUpdate(upd.updateType),
                extendedProps: {
                    type: upd.updateType,
                    message: upd.message,
                    venue: upd.updateType === 'Venue Change' ? upd.message : 'N/A',
                }
            });
        });

        return generatedEvents;
    };
    
    if (loading) {
        return <p>Loading Your Personalized Schedule...</p>;
    }

    return (
        <div className={styles.scheduleContainer}>
            <Toaster position="bottom-center" />
            <div className={styles.header}>
                <h1>Your Weekly Schedule</h1>
                <p>This calendar shows your regular classes and any important updates from teachers.</p>
            </div>
            
            {/* --- NEW: Legend for Colors --- */}
            <div className={styles.legendContainer}>
                {updateTypes.map(item => (
                    <div key={item.type} className={styles.legendItem}>
                        <span className={styles.legendColorBox} style={{ backgroundColor: item.color }}></span>
                        {item.type}
                    </div>
                ))}
            </div>

            <div className={styles.calendarWrapper}>
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
                    noEventsText="No lectures or updates scheduled for your class in this period."
                    height="auto"
                    // Use eventContent to customize rendering
                    eventContent={(arg) => (
                        <div className={styles.eventItem}>
                            <div className={styles.eventTime}>{arg.timeText}</div>
                            <div className={styles.eventTitle}>{arg.event.title}</div>
                            <div className={styles.eventType} style={{ backgroundColor: arg.event.backgroundColor }}>
                                {arg.event.extendedProps.type}
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

export default StudentSchedulePage;