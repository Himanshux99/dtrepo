const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();

// --- DECODING LOGIC (MOVED TO THE BACKEND) ---
const BRANCH_SHORT_MAP = {
    '101': 'IT',
    '102': 'CMPN',
    '104': 'EXTC',
    '108': 'EXCS',
};

function decodeRollNumber(rollNumber) {
    if (!rollNumber || rollNumber.length !== 10) {
        return null; // Invalid format
    }
    const admissionYearShort = parseInt(rollNumber.substring(0, 2), 10);
    const branchCode = rollNumber.substring(2, 5);
    const division = rollNumber.substring(5, 6);
    const admissionYear = 2000 + admissionYearShort;
    
    // Calculate current academic year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    let academicYear = now.getFullYear() - admissionYear;
    if (currentMonth < 7) { // Academic year usually changes around July
        academicYear = now.getFullYear() - admissionYear - 1;
    }
    academicYear += 1;

    if (academicYear > 4) {
        return null; // Graduated
    }

    return {
        academicYear: academicYear.toString(),
        branch: BRANCH_SHORT_MAP[branchCode] || 'UNKNOWN',
        division: division,
    };
}


// --- SCHEDULED CLASS REMINDERS ---
exports.sendClassReminders = onSchedule("every 2 minutes", async (event) => {
    // ... (This function's code remains the same, as it calls the updated notifyStudents)
    const now = new Date();
    const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const tenMinutesFromNowIST = new Date(nowIST.getTime() + 10 * 60 * 1000);
    const dayOfWeek = nowIST.getDay();

    try {
        const schedulesSnapshot = await db.collection("schedules")
            .where("dayOfWeek", "==", dayOfWeek)
            .get();
        if (schedulesSnapshot.empty) {
            logger.info("No classes scheduled for today.");
            return;
        }
        for (const doc of schedulesSnapshot.docs) {
            const schedule = doc.data();
            const [startHour, startMinute] = schedule.startTime.split(":");
            const classStartTime = new Date(nowIST);
            classStartTime.setHours(startHour, startMinute, 0, 0);
            if (classStartTime > nowIST && classStartTime <= tenMinutesFromNowIST) {
                logger.info(`Found upcoming class: ${schedule.classInfo.subject} at ${schedule.startTime}`);
                await notifyStudents(schedule.classInfo, {
                    title: `Class Reminder: ${schedule.classInfo.subject}`,
                    body: `Your class at ${schedule.startTime} is starting in 10 minutes in ${schedule.venue}.`,
                });
            }
        }
    } catch (error) {
        logger.error("Error in sendClassReminders:", error);
    }
});

// --- INSTANT UPDATE NOTIFICATIONS ---
exports.sendUpdateNotification = onDocumentCreated("lecture_updates/{updateId}", async (event) => {
    // ... (This function's code also remains the same)
    const update = event.data.data();
    if (!update) {
        logger.error("No data associated with the event");
        return;
    }
    logger.info(`New lecture update created: ${update.classInfo.subject}`);
    const notificationPayload = {
        title: `Update for ${update.classInfo.subject} [${update.updateType}]`,
        body: update.message,
    };
    try {
        await notifyStudents(update.classInfo, notificationPayload);
    } catch (error) {
        logger.error("Error in sendUpdateNotification:", error);
    }
});


// --- HELPER FUNCTION WITH THE NEW LOGIC ---
async function notifyStudents(classInfo, payload) {
    // 1. Get ALL students
    const allStudentsSnapshot = await db.collection("users")
        .where("role", "==", "student")
        .get();

    if (allStudentsSnapshot.empty) {
        logger.info("No student documents found in the database.");
        return;
    }

    const tokens = [];
    // 2. Loop through each student and check them individually
    allStudentsSnapshot.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        if (!studentData.rollNumber) {
            return; // Skip if no roll number
        }

        // 3. Decode their roll number on the fly
        const decodedInfo = decodeRollNumber(studentData.rollNumber);

        // 4. Compare the decoded info with the target class info
        if (decodedInfo &&
            decodedInfo.academicYear === classInfo.year &&
            decodedInfo.branch === classInfo.branch &&
            decodedInfo.division === classInfo.division) {
            
            // It's a match! Add their token if they have one.
            if (studentData.fcmTokens && studentData.fcmTokens.length > 0) {
                tokens.push(...studentData.fcmTokens);
            }
        }
    });

    // 5. Send the notifications if we found any matching students with tokens
    if (tokens.length > 0) {
        const notification = {
            notification: {
                title: payload.title,
                body: payload.body,
                icon: "/vite.svg",
            },
        };
        logger.info(`Sending notification to ${tokens.length} students for ${classInfo.subject}.`);
        await admin.messaging().sendToDevice(tokens, notification);
    } else {
        logger.info(`No students with tokens found matching criteria for: ${classInfo.year} ${classInfo.branch} ${classInfo.division}`);
    }
}