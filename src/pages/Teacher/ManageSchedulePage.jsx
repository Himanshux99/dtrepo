import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ScheduleForm from '../../components/teacher/ScheduleForm';
import styles from './ManageSchedulePage.module.css';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbreviations = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function ManageSchedulePage() {
    const { currentUser } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [activeDay, setActiveDay] = useState(new Date().getDay()); // Default to current day

    const fetchSchedules = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Teacher fetches only their own schedules
            const q = query(
                collection(db, 'schedules'),
                where('teacherId', '==', currentUser.uid),
                orderBy('startTime')
            );
            const querySnapshot = await getDocs(q);
            const schedulesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSchedules(schedulesData);
        } catch (error) {
            console.error("Error fetching schedules: ", error);
            toast.error("Could not fetch your schedules.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const handleAddSchedule = async (newSchedule) => {
        try {
            await addDoc(collection(db, 'schedules'), newSchedule);
            toast.success('New class added to your schedule!');
            setShowScheduleForm(false);
            fetchSchedules();
        } catch (error) {
            console.error("Error adding schedule: ", error);
            toast.error("Failed to add schedule.");
        }
    };

    const handleEditSchedule = (scheduleData) => {
        setEditingSchedule(scheduleData);
        setShowScheduleForm(true);
    };

    const handleUpdateSchedule = async (updatedScheduleData) => {
        if (!editingSchedule) return;
        try {
            const scheduleRef = doc(db, 'schedules', editingSchedule.id);
            await updateDoc(scheduleRef, updatedScheduleData);
            toast.success('Schedule updated successfully!');
            setShowScheduleForm(false);
            setEditingSchedule(null);
            fetchSchedules();
        } catch (error) {
            console.error("Error updating schedule: ", error);
            toast.error("Failed to update schedule.");
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm("Are you sure you want to delete this class from your schedule?")) return;
        try {
            await deleteDoc(doc(db, 'schedules', id));
            toast.success('Schedule entry deleted.');
            fetchSchedules();
        } catch (error) {
            console.error("Error deleting schedule: ", error);
            toast.error("Failed to delete schedule entry.");
        }
    };

    const groupedSchedules = schedules.reduce((acc, sch) => {
        const dayIndex = sch.dayOfWeek;
        if (!acc[dayIndex]) acc[dayIndex] = [];
        acc[dayIndex].push(sch);
        return acc;
    }, {});

    return (
        <div className={'flex flex-col text-center mt-2 text-xl font-bold px-4 pb-16'}>
            <h1>Manage Your Schedule</h1>
            <p className='text-sm mb-4'>Add, edit, or remove your recurring weekly classes.</p>

            {!showScheduleForm && (
                <button onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }} className={'btn-secondary mb-4'}>
                    + Add New Class
                </button>
            )}
            {showScheduleForm && (
                <ScheduleForm
                    onAdd={editingSchedule ? handleUpdateSchedule : handleAddSchedule}
                    onCancel={() => { setShowScheduleForm(false); setEditingSchedule(null); }}
                    initialData={editingSchedule}
                />
            )}

            <div className={''}>
                {/* Day Selector Tabs */}
                <div className={"flex flex-row items-center justify-around mb-2 mx-4 bg-white p-2 rounded-lg shadow"}>
                    {dayAbbreviations.slice(1, 7).map((day, index) => (
                        <button key={day}
                            onClick={() => setActiveDay(index + 1)}
                            className={`${activeDay === (index + 1) ? 'bg-primary text-primary' : 'bg-tertiary text-secondary'} px-2 py-4 w-16 rounded-lg font-bold tracking-widest`}>
                            {day}
                        </button>
                    ))}
                </div>

                {/* Schedule Cards for selected day */}
                <div className={''}>
                    <h2 className='text-2xl font-bold my-3'>{daysOfWeek[activeDay]}</h2>
                    <div className={'bg-white p-4 rounded-lg shadow flex flex-col gap-4'}>
                        {loading ? <p>Loading...</p> : groupedSchedules[activeDay] ? groupedSchedules[activeDay].map((sch) => (
                            <div key={sch.id} className={'flex flex-row bg-[var(--primary-900)] p-2 rounded-lg text-secondary items-center'}>
                                <div>
                                    <p >{sch.startTime}</p>
                                    <p >{sch.endTime}</p>
                                </div>
                                <div className={'border-l-2 border-[var(--bg-primary)] mx-4 px-4 text-left'}>
                                    <p >{sch.classInfo.subject}</p>
                                    <p >{sch.venue} | {sch.classInfo.year} Yr {sch.classInfo.branch} Div-{sch.classInfo.division}</p>
                                </div>
                                <div className={'ml-auto flex flex-col gap-2 pr-2'}>
                                    <button onClick={() => handleEditSchedule(sch)} className={styles.editButton}>Edit</button>
                                    <button onClick={() => handleDeleteSchedule(sch.id)} className={styles.deleteButton}>Delete</button>
                                </div>
                            </div>
                        )) : <p className={styles.noClass}>No classes scheduled for {daysOfWeek[activeDay]}.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageSchedulePage;