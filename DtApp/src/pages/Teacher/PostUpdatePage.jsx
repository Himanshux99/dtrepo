import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import styles from "./PostUpdatePage.module.css";
import toast, { Toaster } from "react-hot-toast";
import { ChevronDown } from 'lucide-react'

// Helper function to get the current date and time in the correct format for datetime-local input
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  // Adjust for the local timezone offset
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  // Format to 'YYYY-MM-DDTHH:mm'
  return now.toISOString().slice(0, 16);
};


function PostUpdatePage() {
  const { currentUser } = useAuth();

  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state - eventDate now defaults to the current time
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState("");
  const [updateType, setUpdateType] = useState("Cancelled");
  const [message, setMessage] = useState("");
  const [eventDate, setEventDate] = useState(getCurrentDateTimeLocal()); // <-- KEY CHANGE HERE

  const fetchData = useCallback(async () => {
    // ... (fetchData function remains unchanged)
    if (!currentUser) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().teachingAssignments) {
        setTeachingAssignments(userDoc.data().teachingAssignments);
      }

      const updatesCollection = collection(db, "lecture_updates");
      const q = query(
        updatesCollection,
        where("teacherId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const updatesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUpdates(updatesData);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("Failed to fetch your data.");
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAssignmentIndex === "" || !message || !eventDate) {
      toast.error("Please select a class and fill out all fields.");
      return;
    }

    const selectedAssignment = teachingAssignments[selectedAssignmentIndex];

    const newUpdate = {
      teacherId: currentUser.uid,
      classInfo: {
        year: selectedAssignment.year,
        branch: selectedAssignment.branch,
        division: selectedAssignment.division,
        subject: selectedAssignment.subject,
        batches: selectedAssignment.batches,
      },
      updateType,
      message,
      eventDate: new Date(eventDate),
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "lecture_updates"), newUpdate);
      toast.success("Update posted successfully!");

      // Reset form (including the date to the current time again)
      setSelectedAssignmentIndex("");
      setUpdateType("Cancelled");
      setMessage("");
      setEventDate(getCurrentDateTimeLocal()); // <-- KEY CHANGE HERE

      fetchData();

    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to post update.");
    }
  };

  const selectedSubject =
    selectedAssignmentIndex !== "" && teachingAssignments[selectedAssignmentIndex]
      ? teachingAssignments[selectedAssignmentIndex].subject
      : "N/A";


  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAssignments = teachingAssignments.filter((a) =>
    `${a.year} ${a.branch} ${a.division} ${a.batches.join(", ")}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // local state for dropdown open/close
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  // local state for text input
  const [updateSearch, setUpdateSearch] = useState("");

  const updateOptions = [
    "Cancelled",
    "Venue Change",
    "Delayed",
    "Substitute",
    "Info",
  ];

  // filter options based on typed text
  const filteredUpdateOptions = updateOptions.filter((opt) =>
    opt.toLowerCase().includes(updateSearch.toLowerCase())
  );

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

  return (
    <div className={"container py-8 text-primary font-bold pb-16"}>
      <Toaster position="top-center" />
      <h2 className={'mt-4 mb-4 text-2xl font-bold text-center'}>Post a New Lecture Update</h2>
      <form onSubmit={handleSubmit} className={"bg-white p-6 rounded-lg shadow-md mb-8 mx-4 text-secondary flex flex-col gap-2"}>
        {/* ... form fields for class, subject, etc. remain the same ... */}
        <label htmlFor="class-select" >Select Class</label>
        <div className="relative w-full">
          {/* Input field (acts like editable select) */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between bg-tertiary text-secondary font-bold p-3 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
          >
            <input
              type="text"
              value={
                search ||
                (selectedAssignmentIndex !== ""
                  ? `${teachingAssignments[selectedAssignmentIndex].year} Year ${teachingAssignments[selectedAssignmentIndex].branch} (Div ${teachingAssignments[selectedAssignmentIndex].division}) - Batches: ${teachingAssignments[selectedAssignmentIndex].batches.join(", ")}`
                  : "")
              }
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              placeholder="-- Select or type to search class --"
              className="bg-transparent outline-none w-full"
            />
            <ChevronDown className="text-secondary w-5 h-5 ml-2 pointer-events-none" />
          </div>

          {/* Dropdown list */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-tertiary rounded-md shadow-lg max-h-48 overflow-y-auto border border-gray-700">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((a, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      const originalIndex = teachingAssignments.indexOf(a);
                      setSelectedAssignmentIndex(originalIndex);
                      setSearch("");
                      setIsOpen(false);
                    }}
                    className="px-4 py-2  hover:text-tertiary cursor-pointer text-sm font-bold"
                  >
                    {a.year} Year {a.branch} (Div {a.division}) - Batches:{" "}
                    {a.batches.join(", ")}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400 text-sm">
                  No matching classes found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className={''}>
          <label>Subject</label>
          <input type="text" className="inp" value={selectedSubject} readOnly disabled />
        </div>

        <div className={''}>
          <label htmlFor="eventDate">Date and Time of Lecture</label>
          <input
            id="eventDate"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="inp"
          />
        </div>
        <div className="relative w-full">
          <label htmlFor="updateType" className="block mb-1 font-bold text-secondary">
            Update Type
          </label>

          {/* Editable input field */}
          <div
            onClick={() => setIsUpdateOpen(!isUpdateOpen)}
            className="flex items-center justify-between bg-tertiary text-secondary font-bold p-3 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
          >
            <input
              id="updateType"
              type="text"
              value={updateSearch || updateType}
              onChange={(e) => {
                setUpdateSearch(e.target.value);
                setIsUpdateOpen(true);
              }}
              placeholder="Select or type update type"
              className="bg-transparent outline-none w-full"
            />
            <ChevronDown className="text-secondary w-5 h-5 ml-2 pointer-events-none" />
          </div>

          {/* Dropdown list */}
          {isUpdateOpen && (
            <div className="absolute z-10 mt-1 w-full bg-tertiary rounded-md shadow-lg border border-gray-700 max-h-48 overflow-y-auto">
              {filteredUpdateOptions.length > 0 ? (
                filteredUpdateOptions.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setUpdateType(option);
                      setUpdateSearch("");
                      setIsUpdateOpen(false);
                    }}
                    className="px-4 py-2 cursor-pointer text-sm font-bold"
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400 text-sm">
                  No matching type found.
                </div>
              )}
            </div>
          )}
        </div>
        <div className={''}>
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="inp"
            placeholder="Details f the Update Ex: New Vanue E-201"
          ></textarea>
        </div>
        <button type="submit" className={'btn-main'}>
          Post Update
        </button>
      </form>

      {/* ... display for past updates remains the same ... */}
      <hr />
      <div className={'mt-4  text-primary'}>
        <h2 className="mb-2 text-xl mx-4">Your Posted Updates</h2>
        <div className="bg-white p-8 rounded-xl shadow-md flex flex-col gap-4">
          {loading ? (
            <p>Loading...</p>
          ) : (
            updates.map((update) => {
              const subject = update.classInfo
                ? update.classInfo.subject
                : update.subject;

              return (
                <div key={update.id} className={"flex flex-col gap-4 text-2xl font-bold font-inter"}>
                  <div className={"flex flex-row items-center justify-between gap-4 bg-[var(--primary-900)] shadow-hard py-4 pl-2 rounded-lg"}>
                    <span className={"text-secondary fnt-inter"}>{update.eventDate.toDate().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false })}</span>

                    <div className='flex flex-col justify-between w-full items-center gap-2 border-l-4 border-[var(--primary-800)]  p-4'>
                      <div className='flex flex-row justify-between w-full items-center flex-wrap'>
                        <h3 className={"text-secondary pl-2"}>{update.classInfo.subject}</h3>
                        <span className={`text-lg text-white px-2 rounded-lg ${getColorForUpdateType(update.updateType)}`}>{update.updateType}</span>
                      </div>
                      <p className={"bg-white w-full rounded-full px-4 py-1 text-lg text-secondary capitalize"}>{update.message}</p>
                    </div>
                  </div>
                </div>
                // <div key={update.id} className={'mb-4 p-4 bg-tertiary rounded-lg'}>
                //   <h3>
                //     {subject} -{" "}
                //     <span style={{ fontSize: "1rem", fontWeight: "normal" }}>
                //       {update.updateType}
                //     </span>
                //   </h3>
                //   <p>{update.message}</p>
                //   <small>
                //     For: {update.eventDate.toDate().toLocaleString()}
                //   </small>
                // </div>
              );
            })
          )}
          {updates.length === 0 && !loading && (
            <p>You haven't posted any updates yet.</p>
          )}</div>
      </div>
    </div>
  );
}

export default PostUpdatePage;