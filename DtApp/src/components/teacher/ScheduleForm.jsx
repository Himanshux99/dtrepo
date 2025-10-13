import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../pages/Teacher/ManageSchedulePage.module.css';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const years = ["1", "2", "3", "4"];
const branches = ["INFT", "CMPN", "EXTC", "EXCX"];
const divisions = ["A", "B", "C"];

function ScheduleForm({ onAdd, onCancel, isAdmin = false, initialData = null }) {
    const { currentUser } = useAuth();

    const [year, setYear] = useState('3');
    const [branch, setBranch] = useState('INFT');
    const [division, setDivision] = useState('A');
    const [subject, setSubject] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(0);
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
            dayOfWeek: Number(dayOfWeek +1),
            startTime,
            endTime,
            venue,
            teacherId: isAdmin ? teacherId : currentUser.uid,
            teacherName: isAdmin ? teacherName : currentUser.email,
        };
        onAdd(scheduleData);
    };

    return (
        <form onSubmit={handleSubmit} className={'flex flex-col w-full'}>
            <h4>{initialData ? 'Edit Class Schedule' : 'Add a New Class'}</h4>
            <div className="flex flex-col gap-4 p-4 text-secondary">
  {/* Year Selection */}
  <div className={'bg-white p-4 rounded-lg'}>
    <label className="block mb-2 text-secondary text-left flex flex-col font-bold">Year</label>
    <div className="flex flex-wrap gap-2">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => setYear(y)}
          className={`px-4 py-2 rounded-md border ${
            year === y
              ? "bg-primary text-white border-secondary"
              : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
          } transition-colors duration-150`}
        >
          {y} Year
        </button>
      ))}
    </div>
  </div>

  {/* Branch Selection */}
  <div className={'bg-white p-4 rounded-lg'}>
    <label className="block mb-2 text-secondary text-left flex flex-col font-bold">Branch</label>
    <div className="flex flex-wrap gap-2">
      {branches.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => setBranch(b)}
          className={`px-4 py-2 rounded-md border ${
            branch === b
              ? "bg-primary text-white border-secondary"
              : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
          } transition-colors duration-150`}
        >
          {b}
        </button>
      ))}
    </div>
  </div>

  {/* Division Selection */}
  <div className={'bg-white p-4 rounded-lg'}>
    <label className="block mb-2 text-secondary text-left flex flex-col font-bold">Division</label>
    <div className="flex flex-wrap gap-2">
      {divisions.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDivision(d)}
          className={`px-4 py-2 rounded-md border ${
            division === d
              ? "bg-primary text-white border-secondary"
              : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
          } transition-colors duration-150`}
        >
          Div {d}
        </button>
      ))}
    </div>
  </div>

  

  {/* Day of Week Selection */}
  <div className={'bg-white p-4 rounded-lg'}>
    <label className="block mb-2 text-secondary text-left flex flex-col font-bold">Day of Week</label>
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {daysOfWeek.map((day, index) => (
        <button
          key={day}
          type="button"
          onClick={() => { setDayOfWeek(index); console.log(day+" "+ index); }}
          className={`px-4 py-2 rounded-md border ${
            dayOfWeek === index
              ? "bg-primary text-white border-secondary"
              : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
          } transition-colors duration-150`}
        >
          {day.substring(0, 3).toUpperCase()}
          
          
        </button>
      ))}
    </div>
  </div>

      {/* Subject Name */}
  <input
    type="text"
    placeholder="Subject Name"
    value={subject}
    onChange={(e) => setSubject(e.target.value)}
    required
    className="bg-tertiary border border-gray-500 rounded-md p-2 text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
  />

  {/* Time Inputs */}
  <div className="flex gap-4">
  <input
  type="time"
  value={startTime}
  onClick={(e) => e.target.showPicker && e.target.showPicker()} // 👈 This opens the picker anywhere you click
  onChange={(e) => {
    const newStart = e.target.value;
    setStartTime(newStart);

    // Auto set end time 2 hours later
    if (newStart) {
      const [hours, minutes] = newStart.split(":").map(Number);
      let newHours = hours + 2;
      if (newHours >= 24) newHours -= 24;

      const formattedEnd =
        String(newHours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
      setEndTime(formattedEnd);
    }
  }}
  required
  className="bg-tertiary flex-1 border border-gray-500 rounded-md p-2 text-secondary cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
/>

<input
  type="time"
  value={endTime}
  onClick={(e) => e.target.showPicker && e.target.showPicker()} // 👈 opens picker on full click
  onChange={(e) => setEndTime(e.target.value)}
  required
  className="bg-tertiary flex-1 border border-gray-500 rounded-md p-2 text-secondary cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
/>

</div>

  {/* Venue */}
  <input
    type="text"
    placeholder="Venue (e.g., 501)"
    value={venue}
    onChange={(e) => setVenue(e.target.value)}
    required
    className="bg-tertiary border border-gray-500 rounded-md p-2 text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
  />

  {/* Admin-specific fields */}
  {isAdmin && (
    <>
      <input
        type="text"
        placeholder="Teacher Name"
        value={teacherName}
        onChange={(e) => setTeacherName(e.target.value)}
        required
        className="bg-tertiary border border-gray-500 rounded-md p-2 text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
      />
      <input
        type="text"
        placeholder="Teacher Firestore UID"
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        required
        className="bg-tertiary border border-gray-500 rounded-md p-2 text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
      />
    </>
  )}
</div>

            <div className={'flex flex-col mx-4 mb-8'}>
                <button type="submit" className={'btn-secondary mb-2 !bg-green-500 !text-white'}>{initialData ? 'Update Schedule' : 'Add Schedule'}</button>
                <button type="button" onClick={onCancel} className={'btn-secondary'}>Cancel</button>
            </div>
        </form>
    );
}

export default ScheduleForm;