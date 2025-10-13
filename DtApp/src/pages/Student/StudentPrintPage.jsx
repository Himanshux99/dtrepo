import React, { useState, useEffect, useCallback } from 'react';
import { db, storage, functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, runTransaction, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Check, Ellipsis, File } from 'lucide-react';

// --- Configuration ---
const RATES_DOC_REF = doc(db, 'config', 'print_rates');
const MAX_SLOTS = 50;
const SLOTS_PER_GROUP = 10;
const CONFIG_DOC_REF = doc(db, 'config', 'print_slots');
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const ACCEPT_FILE_STRING = '.pdf,.jpg,.jpeg,.png,.gif';

// --- Helper Functions ---
const generateSlotId = (index) => {
    const groupIndex = Math.floor(index / SLOTS_PER_GROUP);
    const slotNumber = (index % SLOTS_PER_GROUP) + 1;
    const groupLetter = String.fromCharCode(65 + groupIndex);
    return `${groupLetter}-${String(slotNumber).padStart(2, '0')}`;
};

// Enhanced PDF page counting with better error handling
const countPDFPages = async (file) => {
    try {
        if (file.type !== 'application/pdf') {
            throw new Error(`File is not a PDF. Type: ${file.type}`);
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 50MB`);
        }

        const arrayBuffer = await file.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            throw new Error('File is empty or corrupted');
        }

        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        return pageCount;

    } catch (error) {
        // Try fallback method
        try {
            const fallbackCount = await countPDFPagesFallback(file);
            if (fallbackCount > 0) return fallbackCount;
        } catch (fallbackError) {
            console.error('Fallback method failed:', fallbackError);
        }

        if (error.message.includes('Invalid PDF')) {
            throw new Error(`Invalid PDF file: ${file.name}. The file may be corrupted.`);
        } else if (error.message.includes('too large')) {
            throw new Error(`File too large: ${file.name}. Please use a smaller PDF file.`);
        } else if (error.message.includes('empty')) {
            throw new Error(`Empty file: ${file.name}. Please select a valid PDF file.`);
        } else {
            throw new Error(`Failed to process PDF: ${file.name}. ${error.message}`);
        }
    }
};

// Fallback method for PDF page counting
const countPDFPagesFallback = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/gi);
    return pageMatches ? pageMatches.length : 0;
};

function StudentPrintPage() {
    const { currentUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [totalPageCount, setTotalPageCount] = useState(0);
    const [manualPageCount, setManualPageCount] = useState(0);
    const [useManualCount, setUseManualCount] = useState(false);
    const [copies, setCopies] = useState(1);
    const [color, setColor] = useState('B&W');
    const [sided, setSided] = useState('Single-Sided');
    const [isStapled, setIsStapled] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [rates, setRates] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isCounting, setIsCounting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [jobs, setJobs] = useState([]);

    // ✅ FIX: Load Razorpay script on component mount
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onerror = () => {
            toast.error("Failed to load payment gateway. Please refresh the page.");
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const fetchJobs = useCallback(async () => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'print_jobs'), 
            where('submittedById', '==', currentUser.uid), 
            orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setJobs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, [currentUser]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const docSnap = await getDoc(RATES_DOC_REF);
            if (docSnap.exists()) {
                setRates(docSnap.data());
            } else {
                toast.error("Printing rates are not configured. Please contact an admin.");
            }
            fetchJobs();
        };
        if (currentUser) fetchInitialData();
    }, [currentUser, fetchJobs]);

    useEffect(() => {
        const effectivePageCount = useManualCount ? manualPageCount : totalPageCount;

        if (!rates || effectivePageCount <= 0) {
            setTotalPrice(0);
            return;
        }
        let pageCost = color === 'Color' ? rates.perPageColor : rates.perPageBw;
        let total = effectivePageCount * copies * pageCost;
        if (sided === 'Double-Sided') total *= rates.doubleSidedMultiplier;
        if (isStapled) total += rates.staplingFee;
        setTotalPrice(total);
    }, [totalPageCount, manualPageCount, useManualCount, copies, color, sided, isStapled, rates]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return '#ffc107';
            case 'Ready': return '#28a745';
            case 'Collected': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const handleFilesChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) {
            setFiles([]);
            setTotalPageCount(0);
            return;
        }

        const invalidFile = selectedFiles.find(file => !ALLOWED_FILE_TYPES.includes(file.type));
        if (invalidFile) {
            toast.error(`Invalid file type: ${invalidFile.name}. Only PDFs and Images are supported.`);
            setFiles([]);
            e.target.value = null;
            return;
        }

        setFiles(selectedFiles);
        setIsCounting(true);
        const loadingToast = toast.loading("Counting pages...");

        try {
            const pageCountPromises = selectedFiles.map(async (file) => {
                try {
                    if (file.type.startsWith('image/')) return 1;
                    if (file.type === 'application/pdf') return await countPDFPages(file);
                    return 0;
                } catch (fileError) {
                    toast.error(`Error processing ${file.name}: ${fileError.message}`);
                    return 0;
                }
            });

            const counts = await Promise.all(pageCountPromises);
            const pages = counts.reduce((sum, count) => sum + count, 0);

            setTotalPageCount(pages);
            toast.dismiss(loadingToast);

            if (pages > 0) {
                toast.success(`Total pages calculated: ${pages}`);
            } else {
                toast.error("No valid pages found in the selected files");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(`Could not count PDF pages: ${error.message}`);
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
                let currentSlotIndex = slotDoc.exists() ? slotDoc.data().currentSlotIndex || 0 : 0;
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

    // ✅ FIX: Enhanced submitPrintJob with better error handling
    const submitPrintJob = async (toastId, paymentId, effectivePageCount) => {
        try {
            toast.loading("Payment verified! Uploading files...", { id: toastId });
            
            const slotId = await assignNewSlot();
            if (!slotId) throw new Error("Failed to assign a slot.");

            const uploadedFilesData = [];
            
            // Upload files with progress tracking
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                toast.loading(`Uploading file ${i + 1}/${files.length}...`, { id: toastId });
                
                try {
                    const storageRef = ref(storage, `print-jobs/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);
                    uploadedFilesData.push({ fileName: file.name, fileUrl: downloadURL });
                } catch (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);
                    throw new Error(`Failed to upload ${file.name}. Contact support with payment ID: ${paymentId}`);
                }
            }

            toast.loading("Submitting print job...", { id: toastId });

            const jobData = {
                submittedById: currentUser.uid,
                submittedByEmail: currentUser.email,
                files: uploadedFilesData,
                slotId,
                totalPageCount: effectivePageCount,
                copies,
                color,
                sided,
                isStapled,
                instructions: instructions.trim(),
                status: 'In Progress',
                submittedAt: Timestamp.now(),
                paymentId,
                paymentAmount: totalPrice,
                paymentStatus: 'Paid',
            };

            await addDoc(collection(db, 'print_jobs'), jobData);
            
            toast.success(
                `Job submitted! Your Slot ID is ${slotId}`, 
                { id: toastId, duration: 5000 }
            );
            
            // Reset form
            setFiles([]);
            setTotalPageCount(0);
            setManualPageCount(0);
            setUseManualCount(false);
            setCopies(1);
            setColor('B&W');
            setSided('Single-Sided');
            setIsStapled(false);
            setInstructions('');
            document.getElementById('file-upload').value = null;
            
            fetchJobs();
        } catch (error) {
            console.error("Error submitting print job after payment:", error);
            toast.error(
                error.message || "Payment successful, but job submission failed. Please contact staff.", 
                { id: toastId, duration: 8000 }
            );
        } finally {
            setUploading(false);
        }
    };

    // ✅ FIX: Complete handleSubmit with all fixes
    const handleSubmit = async (e) => {
        e.preventDefault();

        const effectivePageCount = useManualCount ? manualPageCount : totalPageCount;

        if (totalPrice <= 0 || files.length === 0 || effectivePageCount <= 0) {
            toast.error("Please select files, ensure page count is set, and price is calculated.");
            return;
        }

        if (!window.Razorpay) {
            toast.error("Payment gateway is still loading. Please wait a moment and try again.");
            setUploading(false); // ✅ FIX: Reset state
            return;
        }

        setUploading(true); // ✅ FIX: Only set once

        try {
            const createOrder = httpsCallable(functions, 'createRazorpayOrder');
            const orderResponse = await createOrder({ amount: Math.round(totalPrice * 100) });
            
            // ✅ FIX: Access nested order object
            const order = orderResponse.data.order;

            if (!order || !order.id) {
                throw new Error("Invalid order response from server");
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "V-Print Service",
                description: `Print job with ${effectivePageCount} pages`, // ✅ FIX: Use effectivePageCount
                order_id: order.id,
                handler: async function (response) {
                    const toastId = toast.loading("Verifying payment...");
                    try {
                        const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
                        const verifyResponse = await verifyPayment({
                            order_id: response.razorpay_order_id,
                            payment_id: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                        });

                        // ✅ FIX: Check verification response
                        if (verifyResponse.data.verified) {
                            await submitPrintJob(toastId, response.razorpay_payment_id, effectivePageCount);
                        } else {
                            throw new Error("Payment verification failed");
                        }
                    } catch (err) {
                        console.error("Payment verification error:", err);
                        toast.error(
                            "Payment verification failed. Please contact staff with payment ID: " + 
                            response.razorpay_payment_id, 
                            { id: toastId, duration: 8000 }
                        );
                        setUploading(false);
                    }
                },
                prefill: { 
                    email: currentUser.email,
                    name: currentUser.displayName || currentUser.email 
                },
                theme: { color: "#007bff" },
                modal: {
                    // ✅ FIX: Handle modal dismiss
                    ondismiss: function() {
                        toast.error("Payment cancelled");
                        setUploading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            // ✅ FIX: Better error handling
            rzp.on('payment.failed', function (response) {
                const errorMsg = response.error?.description || 'Unknown error';
                toast.error(`Payment failed: ${errorMsg}`);
                console.error("Payment failed:", response.error);
                setUploading(false);
            });

            rzp.open();

        } catch (error) {
            console.error("Payment initiation failed:", error);
            
            // ✅ FIX: Better error messages
            if (error.message.includes("unauthenticated")) {
                toast.error("Please log in to continue");
            } else if (error.message.includes("network")) {
                toast.error("Network error. Please check your connection and try again.");
            } else {
                toast.error(`Could not start payment: ${error.message}`);
            }
            
            setUploading(false);
        }
    };

    return (
        <div className="p-4 pb-16">
            <Toaster position="top-center" />

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Print Services</h1>
                <p>Submit your documents for printing with our secure service</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full bg-secondary p-6 rounded-lg">
                <div className="border-dashed border-4 border-[var(--bg-tertiary)] flex flex-col gap-3 items-center justify-center p-6 rounded-lg cursor-pointer transition relative">
                    <span className="text-[var(--bg-primary)] text-sm"><FileUp size={60} /></span>

                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFilesChange}
                        accept={ACCEPT_FILE_STRING}
                        multiple
                        className="hidden"
                    />

                    <label htmlFor="file-upload" className="inline-block bg-tertiary text-[var(--bg-primary)] px-5 py-2 rounded-full font-medium text-sm cursor-pointer">
                        Upload Files
                    </label>

                    {files.length > 0 && (
                        <div className="mt-2 border border-blue-400 rounded-lg">
                            <p className="text-secondary p-3 text-lg font-bold rounded-lg bg-tertiary">
                                <strong>{files.length}</strong> file(s) selected
                            </p>
                        </div>
                    )}
                </div>

                {files.length > 0 && (
                    <div className="border-none">
                        <div className="flex items-center justify-center gap-2 rounded-lg">
                            <span className="text-secondary">Total Pages:</span>
                            <span className="text-secondary font-semibold text-xl">
                                {isCounting ? "Counting..." : (useManualCount ? manualPageCount : totalPageCount)}
                            </span>
                        </div>
                        {totalPageCount === 0 && !isCounting && (
                            <div className="mt-4 p-3 bg-warning-50 border border-warning-500 rounded-lg">
                                <p className="text-warning-500 text-secondary text-sm mb-2">
                                    Automatic page counting failed. You can manually enter the page count below.
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualPageCount}
                                        onChange={(e) => setManualPageCount(parseInt(e.target.value) || 0)}
                                        className="form-input w-20"
                                        placeholder="Pages"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseManualCount(true);
                                            toast.success(`Using manual page count: ${manualPageCount}`);
                                        }}
                                        className="btn btn-warning btn-sm"
                                        disabled={manualPageCount <= 0}
                                    >
                                        Use Manual Count
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Rest of your form components remain the same */}
                <div className="grid md:grid-cols-2 gap-6 font-family">
                    <div className="font-inter font-bold text-secondary flex flex-col items-center gap-4 bg-tertiary p-3 rounded-lg">
                        <div className="flex items-center justify-between gap-1 w-full overflow-hidden w-max">
                            <div className="w-1/2 flex flex-col items-center pr-4">
                                <label className="text-2xl pl-2">Copies</label>
                            </div>
                            <div className="flex gap-2 pr-4">
                                <input
                                    type="number"
                                    min="1"
                                    value={copies}
                                    onChange={(e) => setCopies(Number(e.target.value))}
                                    required
                                    className="h-10 w-16 bg-white text-center text-secondary text-2xl font-bold flex items-center justify-center border-none rounded-lg"
                                />
                                <div className="h-10 flex flex-col-2 item-center gap-1px-2 rounded-lg py-1 bg-white text-2xl transition font-bold">
                                    <button type="button" onClick={() => setCopies(Math.max(1, copies - 1))} className="p-4 flex items-center justify-center">
                                        -
                                    </button>
                                    <button type="button" onClick={() => setCopies(copies + 1)} className="p-4 border-l-4 border-[var(--color-primary)] flex items-center justify-center">
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-2 bg-tertiary font-inter font-bold rounded-lg w-full text-secondary">
                    <button type="button" onClick={() => setSided('Single-Sided')} className={`${sided === 'Single-Sided' ? 'bg-primary text-primary' : ''} selectButton`}>
                        Single-Sided
                    </button>
                    <button type="button" onClick={() => setSided('Double-Sided')} className={`${sided === 'Double-Sided' ? 'bg-primary text-primary' : ''} selectButton`}>
                        Double-Sided
                    </button>
                </div>

                <div className="flex flex-col-2 bg-tertiary font-inter font-bold rounded-lg w-full text-secondary">
                    <button type="button" onClick={() => setColor('B&W')} className={`${color === 'B&W' ? 'bg-primary text-primary' : ''} selectButton`}>
                        B&W
                    </button>
                    <button type="button" onClick={() => setColor('Color')} className={`${color === 'Color' ? 'bg-primary text-primary' : ''} selectButton`}>
                        Color
                    </button>
                </div>

                <div className="flex flex-col-2 bg-tertiary font-inter font-bold rounded-lg w-full text-secondary">
                    <button type="button" onClick={() => setIsStapled(false)} className={!isStapled ? 'bg-primary text-primary selectButton' : 'selectButton'}>
                        No Stapling
                    </button>
                    <button type="button" onClick={() => setIsStapled(true)} className={isStapled ? 'bg-primary text-primary selectButton' : 'selectButton'}>
                        Staple
                    </button>
                </div>

                <div className="flex flex-col gap-2 text-secondary font-bold text-xl">
                    <label htmlFor="instructions">Additional Instructions (Optional)</label>
                    <textarea
                        id="instructions"
                        rows="3"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="border border-gray-300 rounded-md px-4 py-2 w-full bg-tertiary text-secondary placeholder:text-lg focus:outline-none focus:border-black-200"
                        placeholder="e.g., 'Print pages 1-5 only', 'Bind spiral', 'Special paper type'"
                    />
                </div>

                <div className="text-center text-secondary border-4 border-[var(--border-color)] rounded-md p-2 w-full">
                    <h3 className="text-xl font-bold p-2">
                        Estimated Cost: <span>₹{totalPrice.toFixed(2)}</span>
                    </h3>
                </div>

                <button
                    type="submit"
                    className="tabButton w-full p-4 font-bold text-lg bg-primary rounded-lg text-primary hover:none"
                    disabled={uploading || totalPrice <= 0 || isCounting}
                >
                    {isCounting ? 'Calculating...' : (uploading ? 'Processing...' : `Proceed to Pay (₹${totalPrice.toFixed(2)})`)}
                </button>
            </form>

            {/* Print Jobs History */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6">Your Print Jobs</h2>
                <div>
                    {jobs.length === 0 ? (
                        <div className="card text-center py-12 text-secondary font-bold">
                            <div className="text-4xl mb-4 flex flex-col items-center"><File size={60} /></div>
                            <h3 className="text-lg mb-2">No Print Jobs Yet</h3>
                            <p className="text-secondary">Submit your first print job using the form above</p>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div key={job.id} className="flex flex-cols-3 bg-white p-4 mb-2 rounded-lg justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="text-xl bg-primary p-2 rounded-lg font-inter font-bold">{job.slotId}</div>
                                    <div>
                                        <div className="font-semibold text-lg text-secondary font-bold">
                                            ₹{job.paymentAmount?.toFixed(0)}
                                            {job.totalPageCount ? ` • ${job.totalPageCount} Page(s)` : ' NaN'}
                                            {` • ` + new Date(job.submittedAt?.toDate()).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-secondary text-lg font-bold">
                                            {job.files[0].fileName.length > 18 ? `${job.files[0].fileName.substring(0, 18)}...` : `${job.files[0].fileName}`}
                                        </div>
                                        <div className="text-secondary text-sm">
                                            {job.instructions && <>Instructions: <em>{job.instructions}</em></>}
                                        </div>
                                    </div>
                                </div>
                                <span className="p-2 mr-4 rounded-full text-sm font-semibold" style={{ backgroundColor: getStatusColor(job.status) }}>
                                    {job.status === "Ready" ? <Check size={35} /> : <Ellipsis size={35} />}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentPrintPage;