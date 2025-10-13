// functions/index.js
// Complete Cloud Functions for FCM Notifications & Razorpay Payment

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// Define Razorpay secret keys
const razorpayKeyId = defineString('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineString('RAZORPAY_KEY_SECRET');

// ============================================
// HELPER: Initialize Razorpay
// ============================================

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: razorpayKeyId.value(),
    key_secret: razorpayKeySecret.value(),
  });
};

// ============================================
// RAZORPAY: Create Order
// ============================================

exports.createRazorpayOrder = onCall({ cors: true }, async (request) => {
  try {
    // Optional: Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount } = request.data;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Amount must be a positive number');
    }

    // Amount should be in paise (smallest currency unit)
    if (amount < 100) {
      throw new HttpsError('invalid-argument', 'Amount must be at least 100 paise (1 INR)');
    }

    const razorpay = getRazorpayInstance();
    
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        userId: request.auth.uid,
        created_at: new Date().toISOString(),
      },
    };

    const order = await razorpay.orders.create(options);
    
    console.log(`Order created: ${order.id} for user ${request.auth.uid}`);
    return { order };

  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to create order. Please try again.', error.message);
  }
});

// ============================================
// RAZORPAY: Verify Payment
// ============================================

exports.verifyRazorpayPayment = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { order_id, payment_id, signature } = request.data;

    // Validate input
    if (!order_id || !payment_id || !signature) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields: order_id, payment_id, or signature'
      );
    }

    // Verify signature
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret.value())
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (isValid) {
      console.log(`Payment verified: ${payment_id} for user ${request.auth.uid}`);
      
      // Store payment info in Firestore
      await db.collection('payments').doc(payment_id).set({
        order_id,
        payment_id,
        userId: request.auth.uid,
        verified: true,
        verified_at: FieldValue.serverTimestamp(),
        created_at: FieldValue.serverTimestamp(),
      });

      return { 
        status: 'success',
        verified: true,
        payment_id 
      };
    } else {
      console.warn(`Payment verification failed for: ${payment_id}`);
      throw new HttpsError('permission-denied', 'Payment verification failed. Signature mismatch.');
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Verification failed. Please contact support.', error.message);
  }
});

// ============================================
// FCM: Send Notification to Single User
// ============================================

exports.sendNotificationToUser = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to send notifications');
  }

  const { userId, title, body, data: extraData } = request.data;

  // Validate input
  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Get user's FCM tokens from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return { 
        success: false, 
        message: 'User has not enabled notifications or has no registered devices' 
      };
    }

    // Prepare notification payload
    const message = {
      notification: {
        title: title || 'New Notification',
        body: body || 'You have a new notification',
      },
      data: extraData || {},
    };

    // Send to all user's devices
    const sendPromises = fcmTokens.map(token => 
      messaging.send({ ...message, token })
        .catch(error => {
          console.error(`Failed to send to token ${token}:`, error);
          return { error, token };
        })
    );

    const results = await Promise.allSettled(sendPromises);

    // Collect invalid tokens for cleanup
    const invalidTokens = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected' || (result.value && result.value.error)) {
        console.log(`Removing invalid token: ${fcmTokens[index]}`);
        invalidTokens.push(fcmTokens[index]);
      }
    });

    // Remove invalid tokens from Firestore
    if (invalidTokens.length > 0) {
      await db.collection('users').doc(userId).update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens)
      });
      console.log(`Removed ${invalidTokens.length} invalid tokens`);
    }

    const successCount = results.filter(r => 
      r.status === 'fulfilled' && !r.value?.error
    ).length;
    
    console.log(`Notification sent to ${successCount}/${fcmTokens.length} devices`);
    
    return { 
      success: true, 
      sentTo: successCount,
      total: fcmTokens.length,
      message: `Notification sent to ${successCount} device(s)` 
    };

  } catch (error) {
    console.error('Error in sendNotificationToUser:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ============================================
// FCM: Send Notification to Multiple Users
// ============================================

exports.sendNotificationToUsers = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userIds, title, body, data: extraData } = request.data;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new HttpsError('invalid-argument', 'userIds must be a non-empty array');
  }

  try {
    // Send to each user
    const sendPromises = userIds.map(userId => 
      db.collection('users').doc(userId).get()
        .then(doc => {
          if (!doc.exists) return { userId, success: false };
          
          const tokens = doc.data().fcmTokens || [];
          if (tokens.length === 0) return { userId, success: false };

          return messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: title || 'New Notification',
              body: body || 'You have a new notification',
            },
            data: extraData || {},
          }).then(response => ({ userId, success: true, results: response }));
        })
        .catch(error => {
          console.error(`Error sending to user ${userId}:`, error);
          return { userId, success: false, error };
        })
    );

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Bulk notification: ${successCount}/${userIds.length} users notified`);

    return {
      success: true,
      totalUsers: userIds.length,
      successCount,
      message: `Notification sent to ${successCount}/${userIds.length} users`,
      details: results
    };

  } catch (error) {
    console.error('Error in sendNotificationToUsers:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ============================================
// FCM: Send Test Notification
// ============================================

exports.sendTestNotification = onCall({ cors: true }, async (request) => {
  try {
    const { token } = request.data;

    // Validate input
    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'The function must be called with a valid FCM token');
    }

    const payload = {
      notification: {
        title: '🧪 Test Notification!',
        body: 'If you received this, your setup is working correctly.',
      },
      token: token,
    };

    const response = await messaging.send(payload);
    
    console.log('Test notification sent successfully:', response);
    return { 
      success: true,
      messageId: response 
    };

  } catch (error) {
    console.error('Error sending test notification:', error);
    
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      throw new HttpsError('invalid-argument', 'Invalid or expired FCM token');
    }
    
    throw new HttpsError('internal', 'Error sending notification. Please try again.', error.message);
  }
});

// ============================================
// FIRESTORE TRIGGER: Print Job Ready
// ============================================

exports.notifyPrintJobReady = onDocumentUpdated('print_jobs/{jobId}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const jobId = event.params.jobId;

  // Only proceed if status changed to "Ready"
  if (beforeData.status !== 'Ready' && afterData.status === 'Ready') {
    console.log(`Print job ${jobId} is now ready for pickup at Slot ${afterData.slotId}`);

    try {
      // Get user's FCM tokens
      const userDoc = await db.collection('users').doc(afterData.submittedById).get();

      if (!userDoc.exists) {
        console.log('User not found for notification');
        return null;
      }

      const fcmTokens = userDoc.data().fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log('User has no FCM tokens registered');
        return null;
      }

      // Send notification
      const message = {
        notification: {
          title: '🖨️ Print Job Ready!',
          body: `Your print job at Slot ${afterData.slotId} is ready for pickup!`,
        },
        data: {
          type: 'print_job_ready',
          slotId: afterData.slotId,
          jobId: jobId,
          url: '/student/print',
          tag: `print-job-${jobId}`,
        },
      };

      // Send to all user's devices
      await Promise.all(
        fcmTokens.map(token => 
          messaging.send({ ...message, token })
            .catch(err => console.error('Error sending notification:', err))
        )
      );

      console.log(`Print job ready notification sent for job ${jobId}`);

    } catch (error) {
      console.error('Error in notifyPrintJobReady:', error);
    }
  }

  return null;
});

// ============================================
// FIRESTORE TRIGGER: Lecture Update Posted
// ============================================

exports.notifyLectureUpdate = onDocumentCreated('lecture_updates/{updateId}', async (event) => {
  const updateData = event.data.data();
  const updateId = event.params.updateId;
  
  console.log(`New lecture update: ${updateData.updateType} for ${updateData.classInfo.subject}`);

  try {
    // Get all students
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    if (studentsSnapshot.empty) {
      console.log('No students found');
      return null;
    }

    // Collect all FCM tokens from matching students
    const allTokens = [];
    
    studentsSnapshot.forEach(doc => {
      const studentData = doc.data();
      const tokens = studentData.fcmTokens || [];
      
      // TODO: Add logic to check if student is in the target class
      // For now, we add all student tokens
      
      if (tokens.length > 0) {
        allTokens.push(...tokens);
      }
    });

    if (allTokens.length === 0) {
      console.log('No students with FCM tokens found');
      return null;
    }

    // Prepare notification message
    const message = {
      notification: {
        title: `📚 ${updateData.updateType}: ${updateData.classInfo.subject}`,
        body: updateData.message || 'Check your schedule for details',
      },
      data: {
        type: 'lecture_update',
        updateType: updateData.updateType,
        subject: updateData.classInfo.subject,
        updateId: updateId,
        url: '/student/schedule',
        tag: `lecture-update-${updateId}`,
      },
    };

    // Send to all collected tokens (batch send)
    const batchSize = 500; // FCM limit
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      
      await messaging.sendEachForMulticast({
        tokens: batch,
        ...message,
      }).catch(error => {
        console.error('Error sending batch notification:', error);
      });
    }

    console.log(`Lecture update notification sent to ${allTokens.length} device(s)`);

  } catch (error) {
    console.error('Error in notifyLectureUpdate:', error);
  }

  return null;
});

