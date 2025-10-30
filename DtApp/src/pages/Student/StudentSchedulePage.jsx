import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './StudentSchedulePage.module.css';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { CalendarDays } from 'lucide-react';
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbreviations = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
let roll;

function StudentSchedulePage() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('schedule');
    const [updateFilter, setUpdateFilter] = useState('week');
    const [schedules, setSchedules] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().getDay());

    const getColorForUpdateType = (type) => {
        switch (type) {
            case 'Cancelled':
                return 'bg-red-500';
            case 'Rescheduled':
                return 'bg-yellow-500';
            case 'Updated':
                return 'bg-green-500';
            case 'Venue Change':
                return 'bg-yellow-500';
            case 'Delayed':
                return 'bg-blue-500';
            default:
                return 'bg-pink-500';
        }
    };

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error("Could not find user profile.");

            const studentDetails = decodeRollNumber(userDoc.data().rollNumber, userDoc.data().email);
            roll = userDoc.data().rollNumber;
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
            const fetchedUpdates = updatesSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));

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

    if (loading) return <div className={"mt-2 w-full h-full"}>
    <div className={"flex flex-row justify-between border-2 mt-4 mx-4 py-2 px-8 border-[var(--bg-tertiary)] rounded-[var(--radius-4xl)] text-[var(--text-primary)]"}>
                <div className="text flex flex-col gap-2 pl-4 justify-center items-start">
                    <span className={"text-2xl font-bold text-left  "}>Your<br />Schedule</span>
                    <span className={"text-xl bg-white rounded-full text-secondary px-4 py-1 font-bold text-center "}>24101X00XX</span>
                </div>
                <div>
                    <img src="/calendar.svg" alt="Calendar" className='w-80' />

                </div>
                {/* <span className={"text-text-3xl font-bold text-center w-full  flex flex-col items-center "}>  <CalendarDays size={80} /></span> */}
            </div></div>;

    return (
        <div className={"mt-2 w-full h-full"}>
            <Toaster position="top-center" />
            <div className={"flex flex-row justify-between border-2 mt-4 mx-2 py-2 px-4 border-[var(--bg-tertiary)] rounded-[var(--radius-4xl)] text-[var(--text-primary)]"}>
                <div className="text flex flex-col gap-2 pl-4 justify-center items-start">
                    <span className={"text-2xl font-bold text-left  "}>Your<br />Schedule</span>
                    <span className={"text-xl bg-white rounded-full text-secondary px-4 py-1 font-bold text-center "}>{roll}</span>
                </div>
                <div>
                    <img src="/calendar.svg" alt="Calendar" className='w-80 ml-2' />

                </div>
                {/* <span className={"text-text-3xl font-bold text-center w-full  flex flex-col items-center "}>  <CalendarDays size={80} /></span> */}
            </div>

            <div className={"flex flex-row items-center justify-center gap-2 my-8"}>
                <button onClick={() => setActiveTab('schedule')} className={`${activeTab === 'schedule' ? 'bg-secondary text-secondary' : 'bg-fourth text-white'} px-4 py-2 rounded-xl text-xl font-bold font-inter`}>TIMETABLE</button>
                <button onClick={() => setActiveTab('updates')} className={` ${activeTab === 'updates' ? 'bg-secondary text-secondary' : 'bg-fourth text-white'} px-4 py-2 rounded-xl text-xl font-bold font-inter`}>UPDATES ({updates.length})</button>
            </div>

            <div className={"bg-white rounded-t-3xl h-full pt-4 mt-2 pb-16"}>
                {activeTab === 'schedule' && (
                    <div className={`h-full pb-16 w-full`}>
                        <div className={"flex flex-row items-center justify-center gap-2 mb-2 below-390:mb-0"}>
                            {dayAbbreviations.slice(1, 6).map((day, index) => (
                                <button key={day} onClick={() => setActiveDay(index + 1)} 
                                className={`${activeDay === (index + 1) 
                                    ? 'bg-primary text-primary' 
                                    : 'bg-tertiary text-secondary'} px-4 py-4 rounded-lg font-bold below-390:p-3 below-390:text-sm my-2`}>{day}</button>
                            ))}
                        </div>
                        <div className={""}>
                            <h2>{daysOfWeek[activeDay]}</h2>
                            <div className={" flex flex-col gap-4 mx-6 mb-4 text-xl font-bold font-inter"}>
                                {groupedSchedules[activeDay] ? groupedSchedules[activeDay].map((sch, index) => (
                                    <div key={index} className={"flex flex-row items-center justify-start gap-4 bg-[var(--primary-900)] shadow-hard py-4 px-4 rounded-lg"}>
                                        <div className={"pl-2"}><p className={"text-secondary"}>{sch.startTime}</p><p className={""}>{sch.endTime}</p></div>
                                        <div className={"border-l-8 border-[var(--primary-800)] pl-4 text-[var(--secondary-900)] w-full"}><p className={"ml-2"}>{sch.classInfo.subject}</p><p className={"bg-white px-4 mt-2 py-1 w-full rounded-full"}>{sch.venue} <span className={"border-l-4 border-[var(--secondary-900)] pl-2"}>{sch.teacherName.substring(0, 9) || 'N/A'}</span></p></div>
                                    </div>
                                )) : <p className={styles.noClass}>No classes scheduled for {daysOfWeek[activeDay]}.</p>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'updates' && (
                    <div>
                        <div className={"flex flex-row items-center justify-center gap-4 mb-4 p-2"}>
                            <button onClick={() => setUpdateFilter('today')} className={`${updateFilter === 'today' ? 'text-primary bg-primary' : 'text-secondary bg-secondary'} rounded-full border-2 border-[var(--bg-primary)] font-bold p-2 w-20`}>Today</button>
                            <button onClick={() => setUpdateFilter('week')} className={`${updateFilter === 'week' ? 'text-primary bg-primary' : 'text-secondary bg-secondary'} rounded-full border-2 border-[var(--bg-primary)] font-bold p-2 w-20`}>Week</button>
                            <button onClick={() => setUpdateFilter('month')} className={`${updateFilter === 'month' ? 'text-primary bg-primary' : 'text-secondary bg-secondary'} rounded-full border-2 border-[var(--bg-primary)] font-bold p-2 w-20`}>Month</button>
                        </div>
                        <div className={"flex flex-col gap-6 mx-2 mb-4 text-xl font-inter"}>
                            {getFilteredUpdates().length > 0 ? getFilteredUpdates().map(upd => (
                                <div key={upd.id} className={"flex flex-col gap-4 mx-6 mb-4 text-2xl font-bold font-inter"}>
                                    <div className={"flex flex-row items-center justify-between gap-4 bg-[var(--primary-900)] shadow-hard py-4 pl-2 rounded-lg"}>
                                        <span className={"text-secondary fnt-inter"}>{upd.eventDate.toDate().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                        
                                        <div className='flex flex-col justify-between w-full items-center gap-2 border-l-4 border-[var(--primary-800)]  p-4'>
                                        <div className='flex flex-row justify-between w-full items-center flex-wrap'>
                                            <h3 className={"text-secondary pl-2"}>{upd.classInfo.subject}</h3>
                                            <span className={`text-lg text-white px-2 rounded-lg ${getColorForUpdateType(upd.updateType)}`}>{upd.updateType}</span>
                                        </div>
                                        <p className={"bg-white w-full rounded-full px-4 py-1 text-lg text-secondary capitalize"}>{upd.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className={"text-secondary font-inter font-bold"}>No updates for this period.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentSchedulePage;