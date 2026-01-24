import React, { useState, useEffect, useCallback } from "react";
import { db, storage } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import styles from "./StaffPrintQueuePage.module.css";
import toast, { Toaster } from "react-hot-toast";
import {
  sendNotificationToUser,
  NotificationTemplates,
} from "../../utils/notificationHelper";

// Define 24 hours in milliseconds (for the client-side cleanup proxy)
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function StaffPrintQueuePage() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("In Progress");
  const sendManualNotification = async (job) => {
    const toastId = toast.loading(
      `Sending notification to ${job.submittedByEmail}...`
    );

    try {
      const notification = NotificationTemplates.printJobReady(job.slotId);

      await sendNotificationToUser(
        job.submittedById,
        notification.title,
        notification.body,
        notification.data
      );

      toast.success(`Notification sent to ${job.submittedByEmail}!`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification", { id: toastId });
    }
  };

  // Add this button in your JSX where you render job actions:
  {
    jobs.status === "Ready" && (
      <>
        <button
          className={styles.collectedButton}
          onClick={() => updateJobStatus(job.id, "Collected")}
        >
          Mark Collected (Empty Slot)
        </button>

        {/* NEW: Manual notification button */}
        <button
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "bold",
            backgroundColor: "#17a2b8",
            color: "white",
            marginTop: "0.5rem",
          }}
          onClick={() => sendManualNotification(job)}
        >
          🔔 Send Reminder
        </button>
      </>
    );
  }

  // Function to perform cleanup (1-Day Auto-Deletion Logic)
  const cleanupOldJobs = useCallback(async () => {
    // 1. Query for all COLLECTED jobs
    const collectedQuery = query(
      collection(db, "print_jobs"),
      where("status", "==", "Collected")
    );
    const collectedSnapshot = await getDocs(collectedQuery);

    let jobsDeleted = 0;

    collectedSnapshot.docs.forEach(async (doc) => {
      const data = doc.data();

      // Check if the job's collection time is older than 24 hours
      if (
        data.submittedAt &&
        Timestamp.now().toMillis() - data.submittedAt.toMillis() > ONE_DAY_IN_MS
      ) {
        try {
          // DELETE ALL FILES in the job
          data.files.forEach(async (fileData) => {
            const storagePath = fileData.fileUrl
              .split("/o/")[1]
              .split("?alt=media")[0];
            const decodedPath = decodeURIComponent(storagePath);
            const fileRef = ref(storage, decodedPath);
            await deleteObject(fileRef);
          });

          // Delete document from Firestore
          await deleteDoc(doc.ref);
          jobsDeleted++;
        } catch (error) {
          console.error(`Failed to delete old job/file: ${doc.id}`, error);
        }
      }
    });

    if (jobsDeleted > 0) {
      toast.success(`${jobsDeleted} old print slots cleared!`);
    }
  }, []);

  // Fetch ALL jobs and filter them based on the active tab
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Run Cleanup first
      await cleanupOldJobs();

      // Step 2: Fetch ALL jobs
      const q = query(
        collection(db, "print_jobs"),
        orderBy("submittedAt", "asc")
      );
      const querySnapshot = await getDocs(q);

      const allJobs = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setJobs(allJobs);
      // toast.success(`Total print jobs fetched: ${allJobs.length}.`, { duration: 1500 });
    } catch (error) {
      console.error("Error fetching print jobs: ", error);
      toast.error("Failed to fetch print queue.");
    } finally {
      setLoading(false);
    }
  }, [cleanupOldJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateJobStatus = async (jobId, newStatus) => {
    const jobRef = doc(db, "print_jobs", jobId);
    const action =
      newStatus === "Ready" ? "marking as ready" : "marking as collected";
    const successMsg =
      newStatus === "Ready"
        ? `Job ${jobId} marked as READY for pickup!`
        : `Job ${jobId} marked as COLLECTED and slot emptied.`;

    try {
      await updateDoc(jobRef, { status: newStatus });
      toast.success(successMsg);
      fetchJobs();
    } catch (error) {
      console.error(`Error ${action}: `, error);
      toast.error(`Failed to update job status: ${jobId}`);
    }
  };

  const deleteJob = async (job) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete job ${job.slotId} (${job.id})? This action cannot be undone and slot will be cleared.`
      )
    ) {
      return;
    }

    const toastId = toast.loading(`Deleting job ${job.slotId}...`);

    try {
      // 1. Delete ALL files from Firebase Storage
      job.files.forEach(async (fileData) => {
        const storagePath = fileData.fileUrl
          .split("/o/")[1]
          .split("?alt=media")[0];
        const decodedPath = decodeURIComponent(storagePath);
        const fileRef = ref(storage, decodedPath);
        await deleteObject(fileRef);
      });

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, "print_jobs", job.id));

      toast.success(
        `Job ${job.slotId} and associated files deleted successfully!`,
        { id: toastId }
      );
      fetchJobs();
    } catch (error) {
      console.error("Error deleting print job: ", error);
      toast.error(
        `Failed to delete job ${job.slotId}. Check console for details.`,
        { id: toastId }
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "#ffc107"; // Yellow
      case "Ready":
        return "#28a745"; // Green
      case "Collected":
        return "#6c757d"; // Gray
      default:
        return "#6c757d";
    }
  };

  // Client-side filtering based on the selected tab
  const filteredJobs = jobs.filter((job) => job.status === activeTab);

  if (loading) {
    return <p className="flex items-center justify-center font-bold text-3xl h-screen w-screen">Loading Print Queue...</p>;
  }

  return (
    <div className={"text-center pb-16"}>
      {/* <Toaster position="top-center" /> */}
      <div className="font-bold my-4">
        <p className="text-3xl pb-2">Staff Print Queue</p>
        <p>Slot Code is the unique ID for job collection.</p>
      </div>

      {/* Tab Navigation */}
      <div className={"flex gap-2 items-center justify-center"}>
        <button
          className={`${activeTab === "In Progress"
            ? "bg-secondary text-secondary"
            : "bg-tertiary text-secondary"
            } p-2 rounded-lg font-bold`}
          onClick={() => setActiveTab("In Progress")}
        >
          Queue ({jobs.filter((j) => j.status === "In Progress").length})
        </button>
        <button
          className={`${activeTab === "Ready"
            ? "bg-secondary text-secondary"
            : "bg-tertiary text-secondary"
            } p-2 rounded-lg font-bold`}
          onClick={() => setActiveTab("Ready")}
        >
          Printed ({jobs.filter((j) => j.status === "Ready").length})
        </button>
        <button
          className={`${activeTab === "Collected"
            ? "bg-secondary text-secondary"
            : "bg-tertiary text-secondary"
            } p-2 rounded-lg font-bold`}
          onClick={() => setActiveTab("Collected")}
        >
          Collected ({jobs.filter((j) => j.status === "Collected").length})
        </button>
      </div>

      {filteredJobs.length === 0 && (
        <p className={styles.noJobs}>
          No jobs currently in the "{activeTab}" status.
        </p>
      )}

      <div className={"text-secondary mt-4"}>
        {filteredJobs.map((job) => (
          <div key={job.id} className={"card m-2"}>
            {console.log("Rendering job:", job)}
            <div className={"flex flex-col  items-center"}>
              <h3 className="font-bold text-lg text-left">
                Slot ID:{" "}
                <span className={"font-bold text-lg"}>{job.slotId}</span>
                
              </h3>
              <span className={"font-semibold text-lg"}>
                  {" - " + job.submittedByEmail}
                </span>
              {/* <div className="flex flex-rows w-full justify-between items-center"> */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
                {/* Row 1, Col 1 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <strong className="text-sm">Copies:</strong>
                  <span className="bg-tertiary px-2 py-1 rounded-md font-semibold text-sm">
                    {job.copies}
                  </span>
                </div>

                {/* Row 1, Col 2 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <strong className="text-sm">Colour:</strong>
                  <span className="bg-tertiary px-2 py-1 rounded-md font-semibold text-sm">
                    {job.color}
                  </span>
                </div>

                {/* Row 2, Col 1 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <strong className="text-sm">Sided:</strong>
                  <span className="bg-tertiary px-2 py-1 rounded-md font-semibold text-sm">
                    {job.sided}
                  </span>
                </div>

                {/* Row 2, Col 2 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <strong className="text-sm">Stapling:</strong>
                  <span className="bg-tertiary px-2 py-1 rounded-md font-semibold text-sm">
                    {job.isStapled ? "Yes" : "No"}
                  </span>
                </div>
              </div>



{job.instructions && (
                <div className="flex flex-col gap-2 text-left justify-center items-start mt-2">
                  <strong className="font-bold text-center w-full">Instructions:</strong>
                  <span className="font-semibold max-w-[400px] h-auto italic bg-tertiary p-2 rounded-lg break-all">
                    {job.instructions}
                  </span>
                </div>
              )}
              <div
                className={
                  "flex flex-cols gap-2 mt-2  font-bold text-white justify-start items-center"
                }
              >
                {job.files.map((fileData, index) => (
                  <a
                    key={index}
                    href={fileData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary font-bold text-white p-2 rounded-lg"
                    title={`Click to view ${fileData.fileName}`}
                  >
                    Download File
                  </a>
                ))}
                {/* Action: Mark as Ready (Only shown on 'In Progress' tab) */}
                {job.status === "In Progress" && (
                  <button
                    className={"bg-green-600 p-2 rounded-lg"}
                    onClick={() => updateJobStatus(job.id, "Ready")}
                  >
                    Mark Printed
                  </button>
                )}

                {/* Action: Mark as Collected (Only shown on 'Ready' tab) */}
                {job.status === "Ready" && (
                  <button
                    className={"bg-green-600 p-2 rounded-lg"}
                    onClick={() => updateJobStatus(job.id, "Collected")}
                  >
                    Mark Collected
                  </button>
                )}

                {/* Delete Job Button (Visible on all tabs) */}
                {currentUser &&
                  (currentUser.role === "staff" ||
                    currentUser.role === "admin") && (
                    <button
                      className={"bg-red-600 p-2 rounded-lg"}
                      onClick={() => deleteJob(job)}
                    >
                      Delete Job
                    </button>
                  )}
              </div>
              {/* </div> */}

              
              <small className="font-semibold mt-2">
                Submitted At: {job.submittedAt.toDate().toLocaleString()}
              </small>
            </div>
          </div>
        ))}
      </div>
      <button onClick={fetchJobs} className={"bg-white text-secondary font-bold p-2 rounded-lg"}>
        Refresh Queue
      </button>
    </div>
  );
}

export default StaffPrintQueuePage;
