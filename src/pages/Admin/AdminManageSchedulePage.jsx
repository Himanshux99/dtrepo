import React, { useState, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import ScheduleForm from '../../components/teacher/ScheduleForm';
import styles from '../Teacher/ManageSchedulePage.module.css'; // Reusing styles

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbreviations = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const years = ["1", "2", "3", "4"];
const branches = ["INFT", "CMPN", "EXTC", "ETRX", "BIOM"];
const divisions = ["A", "B"];

function AdminManageSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    // State for filters
    const [filterYear, setFilterYear] = useState('3');
    const [filterBranch, setFilterBranch] = useState('INFT');
    const [filterDivision, setFilterDivision] = useState('A');

    // State for UI
    const [activeDay, setActiveDay] = useState(new Date().getDay());

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            // This query requires a composite index in Firestore.
            // If it fails, check the browser console for a link to create it.
            const q = query(
                collection(db, 'schedules'),
                where('classInfo.year', '==', filterYear),
                where('classInfo.branch', '==', filterBranch),
                where('classInfo.division', '==', filterDivision),
                orderBy('startTime')
            );
            const querySnapshot = await getDocs(q);
            const schedulesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSchedules(schedulesData);
            if (schedulesData.length > 0) {
                toast.success(`Fetched schedule for ${filterYear}yr ${filterBranch} Div-${filterDivision}.`);
            } else {
                toast.error(`No schedule found for the selected class.`);
            }
        } catch (error) {
            console.error("Error fetching schedules: ", error);
            toast.error("Query failed. A Firestore index is likely required. Check the console for a link.");
        } finally {
            setLoading(false);
        }
    }, [filterYear, filterBranch, filterDivision]);

    // --- ADDED MISSING FUNCTION ---
    const handleAddSchedule = async (newSchedule) => {
        try {
            await addDoc(collection(db, 'schedules'), newSchedule);
            toast.success('New class schedule added successfully!');
            setShowScheduleForm(false);
            fetchSchedules(); // Refresh the view
        } catch (error) {
            console.error("Error adding schedule: ", error);
            toast.error("Failed to add schedule.");
        }
    };
    // --- END ---

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
        if (!window.confirm("Are you sure you want to delete this schedule entry?")) return;
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
        <div className={styles.container}>
            <Toaster position="top-center" />
            <h1>Manage Master Schedule (Admin)</h1>
            <p>Filter by class to view, edit, or delete schedule entries.</p>

            <div className={styles.filterContainer}>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                    {years.map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)}>
                    {divisions.map(d => <option key={d} value={d}>Div {d}</option>)}
                </select>
                <button onClick={fetchSchedules} disabled={loading}>
                    {loading ? 'Fetching...' : 'View Schedule'}
                </button>
            </div>

            {!showScheduleForm && (
                <button onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }} className={styles.addButton}>
                    + Add New Schedule Entry
                </button>
            )}
            {showScheduleForm && (
                <ScheduleForm
                    onAdd={editingSchedule ? handleUpdateSchedule : handleAddSchedule}
                    onCancel={() => { setShowScheduleForm(false); setEditingSchedule(null); }}
                    isAdmin={true}
                    initialData={editingSchedule}
                />
            )}

            <div className={styles.scheduleList}>
                <div className={styles.daySelector}>
                    {dayAbbreviations.slice(1, 7).map((day, index) => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(index + 1)}
                            className={activeDay === (index + 1) ? styles.activeDay : ''}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <div className={styles.scheduleDayView}>
                    <h2>{daysOfWeek[activeDay]}</h2>
                    <div className={styles.cardsContainer}>
                        {schedules.length > 0 && groupedSchedules[activeDay] ? groupedSchedules[activeDay].map((sch) => (
                            <div key={sch.id} className={styles.scheduleCard}>
                                <div className={styles.timeSection}>
                                    <p className={styles.time}>{sch.startTime}</p>
                                    <p className={styles.timeEnd}>to {sch.endTime}</p>
                                </div>
                                <div className={styles.detailsSection}>
                                    <p className={styles.subject}>{sch.classInfo.subject}</p>
                                    <p className={styles.venue}>{sch.venue} | {sch.teacherName || 'N/A'}</p>
                                </div>
                                <div className={styles.actionsSection}>
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

export default AdminManageSchedulePage;