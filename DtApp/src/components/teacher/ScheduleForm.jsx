import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../pages/Teacher/ManageSchedulePage.module.css';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const years = ["1", "2", "3", "4"];
const branches = ["INFT", "CMPN", "EXTC", "ETRX", "BIOM"];
const divisions = ["A", "B"];

function ScheduleForm({ onAdd, onCancel, isAdmin = false, initialData = null }) {
    const { currentUser } = useAuth();

    const [year, setYear] = useState('3');
    const [branch, setBranch] = useState('INFT');
    const [division, setDivision] = useState('A');
    const [subject, setSubject] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [venue, setVenue] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [teacherId, setTeacherId] = useState(''); // New state for Teacher ID

    // Pre-fill form if editing
    useEffect(() => {
        if (initialData) {
            setYear(initialData.classInfo.year);
            setBranch(initialData.classInfo.branch);
            setDivision(initialData.classInfo.division);
            setSubject(initialData.classInfo.subject);
            setDayOfWeek(initialData.dayOfWeek);
            setStartTime(initialData.startTime);
            setEndTime(initialData.endTime);
            setVenue(initialData.venue);
            if (isAdmin) {
                setTeacherName(initialData.teacherName || '');
                setTeacherId(initialData.teacherId || '');
            }
        }
    }, [initialData, isAdmin]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const scheduleData = {
            classInfo: { year, branch, division, subject },
            dayOfWeek: Number(dayOfWeek),
            startTime,
            endTime,
            venue,
            teacherId: isAdmin ? teacherId : currentUser.uid,
            teacherName: isAdmin ? teacherName : currentUser.email,
        };
        onAdd(scheduleData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h4>{initialData ? 'Edit Class Schedule' : 'Add a New Class'}</h4>
            <div className={styles.formGrid}>
                <select value={year} onChange={(e) => setYear(e.target.value)} required>{years.map(y => <option key={y} value={y}>{y} Year</option>)}</select>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} required>{branches.map(b => <option key={b} value={b}>{b}</option>)}</select>
                <select value={division} onChange={(e) => setDivision(e.target.value)} required>{divisions.map(d => <option key={d} value={d}>Div {d}</option>)}</select>
                <input type="text" placeholder="Subject Name" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required>{daysOfWeek.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                <input type="text" placeholder="Venue (e.g., 501)" value={venue} onChange={(e) => setVenue(e.target.value)} required />

                {/* Admin-specific fields for assigning a teacher */}
                {isAdmin && (
                    <>
                        <input type="text" placeholder="Teacher Name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} required />
                        <input type="text" placeholder="Teacher Firestore UID" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required />
                    </>
                )}
            </div>
            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.submitButton}>{initialData ? 'Update Schedule' : 'Add Schedule'}</button>
            </div>
        </form>
    );
}

export default ScheduleForm;