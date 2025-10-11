import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import styles from './VReferPage.module.css';

// Helper function to convert semester number to Roman numeral
const toRoman = (num) => {
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

function VReferPage() {
    const { currentUser } = useAuth();
    const [vReferLink, setVReferLink] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateLink = async () => {
            if (!currentUser) return;

            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const studentDetails = decodeRollNumber(userData.rollNumber, userData.email);

                if (studentDetails && !studentDetails.error) {
                    const branch = studentDetails.branchShortName || 'INFT'; // Default to INFT
                    const semesterRoman = toRoman(studentDetails.currentSemester) || 'III'; // Default to SEM III

                    // Construct the URL based on the provided example
                    // Note: The year part '2025-26' and fileid might need to be dynamic in a real scenario
                    const yearPath = '2025-26'; 
                    const baseUrl = 'http://vidyalankarlive.com/vrefer/index.php/apps/files/';
                    const params = `?dir=/vRefer/${branch}/SEM%20${semesterRoman}/${yearPath}`;

                    setVReferLink(baseUrl + params);
                }
            }
            setLoading(false);
        };

        generateLink();
    }, [currentUser]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(vReferLink);
        toast.success('V-Refer link copied to clipboard!');
    };

    if (loading) {
        return <p>Generating your personalized V-Refer link...</p>;
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-center" />
            <div className={styles.card}>
                <div className={styles.icon}>🔗</div>
                <h1>Your V-Refer Link</h1>
                <p>
                    This link is personalized for your branch and semester. Use it to access notes and other resources.
                </p>
                
                <div className={styles.linkDisplay}>
                    {vReferLink ? vReferLink : "Could not generate link."}
                </div>

                <div className={styles.buttonGroup}>
                    <a href={vReferLink} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
                        Go to V-Refer
                    </a>
                    <button onClick={handleCopyLink} className={styles.secondaryButton}>
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VReferPage;