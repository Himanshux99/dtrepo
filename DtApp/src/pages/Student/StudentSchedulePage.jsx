import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './StudentSchedulePage.module.css';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbreviations = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function StudentSchedulePage() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('schedule');
    const [updateFilter, setUpdateFilter] = useState('week');
    const [schedules, setSchedules] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().getDay());

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error("Could not find user profile.");
            
            const studentDetails = decodeRollNumber(userDoc.data().rollNumber, userDoc.data().email);
            if (studentDetails.error) throw new Error(studentDetails.error);

            // --- DIAGNOSTIC LOG 1: What are we searching for? ---
            console.log("Searching for updates matching:", {
                year: studentDetails.currentAcademicYear.toString(),
                branch: studentDetails.branchShortName,
                division: studentDetails.division,
            });
            // ----------------------------------------------------

            const schedulesQuery = query(
                collection(db, 'schedules'),
                where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
                where('classInfo.branch', '==', studentDetails.branchShortName),
                where('classInfo.division', '==', studentDetails.division),
                orderBy('startTime')
            );
            const updatesQuery = query(
                collection(db, 'lecture_updates'),
                where('classInfo.year', '==', studentDetails.currentAcademicYear.toString()),
                where('classInfo.branch', '==', studentDetails.branchShortName),
                where('classInfo.division', '==', studentDetails.division),
                orderBy('eventDate', 'desc')
            );

            const [schedulesSnapshot, updatesSnapshot] = await Promise.all([
                getDocs(schedulesQuery),
                getDocs(updatesQuery),
            ]);
            
            // --- FIX APPLIED HERE ---
            const fetchedSchedules = schedulesSnapshot.docs.map(d => d.data());
            const fetchedUpdates = updatesSnapshot.docs.map(d => ({...d.data(), id: d.id }));

            // --- DIAGNOSTIC LOG 2: What did we find? ---
            console.log("Fetched Schedules:", fetchedSchedules);
            console.log("Fetched Updates:", fetchedUpdates);
            // -------------------------------------------------

            setSchedules(fetchedSchedules);
            setUpdates(fetchedUpdates);

        } catch (error) {
            console.error("Error fetching data: ", error);
            toast.error(error.message || "Could not fetch data.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const groupedSchedules = schedules.reduce((acc, sch) => {
        const dayIndex = sch.dayOfWeek;
        if (!acc[dayIndex]) acc[dayIndex] = [];
        acc[dayIndex].push(sch);
        return acc;
    }, {});

    const getFilteredUpdates = () => {
        const now = new Date();
        if (updateFilter === 'today') {
            return updates.filter(upd => isToday(upd.eventDate.toDate()));
        }
        if (updateFilter === 'week') {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            return updates.filter(upd => {
                const eventDate = upd.eventDate.toDate();
                return eventDate >= weekStart && eventDate <= weekEnd;
            });
        }
        if (updateFilter === 'month') {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            return updates.filter(upd => {
                const eventDate = upd.eventDate.toDate();
                return eventDate >= monthStart && eventDate <= monthEnd;
            });
        }
        return updates;
    };

    if (loading) return <p>Loading Schedule & Updates...</p>;

    return (
        <div className={styles.container}>
            <Toaster position="top-center" />
            <div className={styles.header}>
                <h1>Schedule & Updates</h1>
                <p>View your weekly timetable and the latest updates from your teachers.</p>
            </div>

            <div className={styles.tabNav}>
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? styles.activeTab : ''}>Weekly Schedule</button>
                <button onClick={() => setActiveTab('updates')} className={activeTab === 'updates' ? styles.activeTab : ''}>Updates ({updates.length})</button>
            </div>

            <div className={styles.contentArea}>
                {activeTab === 'schedule' && (
                    <div>
                        <div className={styles.daySelector}>
                            {dayAbbreviations.slice(1, 7).map((day, index) => (
                                <button key={day} onClick={() => setActiveDay(index + 1)} className={activeDay === (index + 1) ? styles.activeDay : ''}>{day}</button>
                            ))}
                        </div>
                        <div className={styles.scheduleDayView}>
                            <h2>{daysOfWeek[activeDay]}</h2>
                            <div className={styles.cardsContainer}>
                                {groupedSchedules[activeDay] ? groupedSchedules[activeDay].map((sch, index) => (
                                    <div key={index} className={styles.scheduleCard}>
                                        <div className={styles.timeSection}><p className={styles.time}>{sch.startTime}</p><p className={styles.timeEnd}>to {sch.endTime}</p></div>
                                        <div className={styles.detailsSection}><p className={styles.subject}>{sch.classInfo.subject}</p><p className={styles.venue}>{sch.venue} | {sch.teacherName || 'N/A'}</p></div>
                                    </div>
                                )) : <p className={styles.noClass}>No classes scheduled for {daysOfWeek[activeDay]}.</p>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'updates' && (
                    <div>
                        <div className={styles.updateFilterNav}>
                            <button onClick={() => setUpdateFilter('today')} className={updateFilter === 'today' ? styles.activeFilter : ''}>Today</button>
                            <button onClick={() => setUpdateFilter('week')} className={updateFilter === 'week' ? styles.activeFilter : ''}>This Week</button>
                            <button onClick={() => setUpdateFilter('month')} className={updateFilter === 'month' ? styles.activeFilter : ''}>This Month</button>
                        </div>
                        <div className={styles.updatesList}>
                            {getFilteredUpdates().length > 0 ? getFilteredUpdates().map(upd => (
                                <div key={upd.id} className={styles.updateCard}>
                                    <div className={styles.updateHeader}>
                                        <span className={styles.updateType} style={{backgroundColor: upd.updateType === 'Cancelled' ? '#dc3545' : '#ffc107' }}>{upd.updateType}</span>
                                        <span className={styles.updateDate}>{upd.eventDate.toDate().toLocaleDateString()}</span>
                                    </div>
                                    <h3 className={styles.updateSubject}>{upd.classInfo.subject}</h3>
                                    <p className={styles.updateMessage}>{upd.message}</p>
                                    <small className={styles.postedBy}>Posted by: {upd.teacherName}</small>
                                </div>
                            )) : <p className={styles.noUpdates}>No updates for this period.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentSchedulePage;