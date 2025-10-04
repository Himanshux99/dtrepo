import React, { useState, useEffect, useCallback } from "react";
import { db, storage, functions } from "../../firebase/config";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  runTransaction,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import styles from "./StudentPrintPage.module.css";
import toast, { Toaster } from "react-hot-toast";
import { PDFDocument } from "pdf-lib";


// --- Configuration ---
const RATES_DOC_REF = doc(db, "config", "print_rates");
const MAX_SLOTS = 50;
const SLOTS_PER_GROUP = 10;
const CONFIG_DOC_REF = doc(db, "config", "print_slots");
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
];
const ACCEPT_FILE_STRING = ".pdf,.jpg,.jpeg,.png,.gif";

// --- Helper Functions ---
const generateSlotId = (index) => {
  const groupIndex = Math.floor(index / SLOTS_PER_GROUP);
  const slotNumber = (index % SLOTS_PER_GROUP) + 1;
  const groupLetter = String.fromCharCode(65 + groupIndex);
  return `${groupLetter}-${String(slotNumber).padStart(2, "0")}`;
};

function StudentPrintPage() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState("B&W");
  const [sided, setSided] = useState("Single-Sided");
  const [isStapled, setIsStapled] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [rates, setRates] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);

  const fetchJobs = useCallback(async () => {
    if (!currentUser) return;
    const q = query(
      collection(db, "print_jobs"),
      where("submittedById", "==", currentUser.uid),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    setJobs(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [currentUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const docSnap = await getDoc(RATES_DOC_REF);
      if (docSnap.exists()) {
        setRates(docSnap.data());
      } else {
        toast.error(
          "Printing rates are not configured. Please contact an admin."
        );
      }
      fetchJobs();
    };
    if (currentUser) fetchInitialData();
  }, [currentUser, fetchJobs]);

  useEffect(() => {
    if (!rates || totalPageCount <= 0) {
      setTotalPrice(0);
      return;
    }
    let pageCost = color === "Color" ? rates.perPageColor : rates.perPageBw;
    let total = totalPageCount * copies * pageCost;
    if (sided === "Double-Sided") total *= rates.doubleSidedMultiplier;
    if (isStapled) total += rates.staplingFee;
    setTotalPrice(total);
  }, [totalPageCount, copies, color, sided, isStapled, rates]);

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

  const handleFilesChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) {
      setFiles([]);
      setTotalPageCount(0);
      return;
    }
    const invalidFile = selectedFiles.find(
      (file) => !ALLOWED_FILE_TYPES.includes(file.type)
    );
    if (invalidFile) {
      toast.error(
        `Invalid file type: ${invalidFile.name}. Only PDFs and Images are supported.`
      );
      setFiles([]);
      e.target.value = null;
      return;
    }
    setFiles(selectedFiles);
    setIsCounting(true);
    toast.loading("Counting pages...");
    try {
      const pageCountPromises = selectedFiles.map(async (file) => {
        if (file.type.startsWith("image/")) return 1;
        if (file.type === "application/pdf") {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          return pdfDoc.getPageCount();
        }
        return 0;
      });
      const counts = await Promise.all(pageCountPromises);
      const pages = counts.reduce((sum, count) => sum + count, 0);
      setTotalPageCount(pages);
      toast.dismiss();
      toast.success(`Total pages calculated: ${pages}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Could not count PDF pages. Please try again.");
      setFiles([]);
      e.target.value = null;
    } finally {
      setIsCounting(false);
    }
  };

  const assignNewSlot = async () => {
    let newSlotId = null;
    try {
      await runTransaction(db, async (transaction) => {
        const slotDoc = await transaction.get(CONFIG_DOC_REF);
        let currentSlotIndex = slotDoc.exists()
          ? slotDoc.data().currentSlotIndex || 0
          : 0;
        const nextSlotIndex = (currentSlotIndex + 1) % MAX_SLOTS;
        newSlotId = generateSlotId(currentSlotIndex);
        transaction.set(CONFIG_DOC_REF, { currentSlotIndex: nextSlotIndex });
      });
      return newSlotId;
    } catch (error) {
      console.error("Transaction failed: ", error);
      return null;
    }
  };

  const submitPrintJob = async (toastId, paymentId) => {
    try {
      toast.loading("Payment verified! Submitting print job...", {
        id: toastId,
      });
      const slotId = await assignNewSlot();
      if (!slotId) throw new Error("Failed to assign a slot.");

      const uploadedFilesData = [];
      for (const file of files) {
        const storageRef = ref(
          storage,
          `print-jobs/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedFilesData.push({ fileName: file.name, fileUrl: downloadURL });
      }

      const jobData = {
        submittedById: currentUser.uid,
        submittedByEmail: currentUser.email,
        files: uploadedFilesData,
        slotId,
        preferences: {
          copies: Number(copies),
          color,
          sided,
          isStapled,
          instructions,
          totalPageCount,
        },
        status: "In Progress",
        submittedAt: Timestamp.now(),
        paymentId,
        paymentAmount: totalPrice,
        paymentStatus: "Paid",
      };

      await addDoc(collection(db, "print_jobs"), jobData);
      toast.success(`Job submitted! Your Slot ID is ${slotId}`, {
        id: toastId,
      });

      setFiles([]);
      setTotalPageCount(0);
      setCopies(1);
      setColor("B&W");
      setSided("Single-Sided");
      setIsStapled(false);
      setInstructions("");
      document.getElementById("file-upload").value = null;
      fetchJobs();
    } catch (error) {
      console.error("Error submitting print job after payment:", error);
      toast.error(
        "Payment successful, but job submission failed. Please contact staff.",
        { id: toastId }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.Razorpay) {
      toast.error(
        "Payment gateway is still loading. Please wait a moment and try again."
      );
      return;
    }

    if (totalPrice <= 0 || files.length === 0) {
      toast.error("Please select files and ensure price is calculated.");
      return;
    }
    setUploading(true);
    try {
      const createOrder = httpsCallable(functions, "createRazorpayOrder");
      const orderResponse = await createOrder({
        amount: Math.round(totalPrice * 100),
      });
      const order = orderResponse.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your public key_id
        amount: order.amount,
        currency: order.currency,
        name: "V-Print Service",
        order_id: order.id, // Use the order.id from the backend response

        handler: async function (response) {
          const toastId = toast.loading("Verifying payment...");
          try {
            const verifyPayment = httpsCallable(
              functions,
              "verifyRazorpayPayment"
            );
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await submitPrintJob(toastId, response.razorpay_payment_id);
          } catch (err) {
            toast.error("Payment verification failed. Please contact staff.", {
              id: toastId,
            });
          }
        },
        prefill: { email: currentUser.email },
        theme: { color: "#007bff" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed. Please try again.");
        console.error(response.error);
        setUploading(false);
      });
    } catch (error) {
      console.error("Payment initiation failed:", error);
      toast.error("Could not start payment. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className={styles.printContainer}>
      <Toaster position="top-center" />
      <h2>Submit a Print Job</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="file-upload">Documents (PDF & Images Only)</label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFilesChange}
            required
            accept={ACCEPT_FILE_STRING}
            multiple
          />
          {files.length > 0 && (
            <small style={{ color: "#aaa", marginTop: "5px" }}>
              {files.length} file(s) selected.
            </small>
          )}
        </div>

        <div
          className={styles.priceDisplay}
          style={{ textAlign: "left", padding: "10px" }}
        >
          Calculated Total Pages:{" "}
          <strong>{isCounting ? "Counting..." : totalPageCount}</strong>
        </div>

        <div className={styles.formGroup}>
          <label>Number of Copies</label>
          <input
            type="number"
            min="1"
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
            required
          />
        </div>

        <div
          className={styles.formGroup}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #555",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          <label style={{ marginBottom: 0 }}>Color Preference</label>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              onClick={() => setColor("B&W")}
              className={color === "B&W" ? styles.toggleActive : ""}
            >
              B&W
            </button>
            <button
              type="button"
              onClick={() => setColor("Color")}
              className={color === "Color" ? styles.toggleActive : ""}
            >
              Color
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Sided</label>
          <select value={sided} onChange={(e) => setSided(e.target.value)}>
            <option>Single-Sided</option>
            <option>Double-Sided</option>
          </select>
        </div>

        <div
          className={styles.formGroup}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #555",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          <label style={{ marginBottom: 0 }}>Stapling</label>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              onClick={() => setIsStapled(false)}
              className={!isStapled ? styles.toggleActive : ""}
            >
              No Stapling
            </button>
            <button
              type="button"
              onClick={() => setIsStapled(true)}
              className={isStapled ? styles.toggleActive : ""}
            >
              Staple
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="instructions">
            More Print Instructions (Optional)
          </label>
          <textarea
            id="instructions"
            rows="3"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., 'Print pages 1-5 only', 'Bind spiral'."
          />
        </div>

        <div className={styles.priceDisplay}>
          <h3>
            Estimated Cost: <span>₹{totalPrice.toFixed(2)}</span>
          </h3>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={uploading || totalPrice <= 0 || isCounting}
        >
          {isCounting
            ? "Calculating..."
            : uploading
            ? "Processing..."
            : `Proceed to Pay (₹${totalPrice.toFixed(2)})`}
        </button>
      </form>

      <hr />
      <div className={styles.jobList}>
        <h2>Your Print Jobs</h2>
        {jobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div>
              <strong>Slot: {job.slotId}</strong> -{" "}
              {job.files ? `${job.files.length} file(s)` : "Legacy Job"}
            </div>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(job.status) }}
            >
              {job.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentPrintPage;
