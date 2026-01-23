import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { decodeRollNumber } from '../../utils/profileUtils';
import toast, { Toaster } from 'react-hot-toast';
import{Link as Linkicon} from 'lucide-react';

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
        <div className={'flex flex-col max-w-[400px] bg-white m-8 rounded-lg text-secondary font-bold text-center'}>
            <Toaster position="top-center" />
            <div className={"flex flex-col items-center p-8"}>
                <div className={"mb-4"}><Linkicon size={50}/></div>
                <h1>Your V-Refer Link</h1>
                <p className='text-wrap'>
                    This link is personalized for your branch and semester. Use it to access notes and other resources.
                </p>
                
                <p className={"p-4 text-wrap break-all "}>
                    {vReferLink ? vReferLink : "Could not generate link."}
                </p>

                <div className={"flex flex-row w-full mt-4 gap-2 justify-center"}>
                    <a href={vReferLink} target="_blank" rel="noopener noreferrer" 
                    className='flex flex-col items-center  bg-primary rounded-lg text-white font-bold font-inter w-full p-2'>
                        Go to V-Refer
                    </a>
                    <button onClick={handleCopyLink} className='flex flex-col items-center bg-primary rounded-lg text-white font-bold font-inter w-full p-2'>
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VReferPage;