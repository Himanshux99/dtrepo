// src/utils/notificationHelper.js
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Send notification to a single user
 * @param {string} userId - The user's UID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const sendNotification = httpsCallable(functions, 'sendNotificationToUser');
    const result = await sendNotification({ userId, title, body, data });
    console.log('Notification sent:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send notification to multiple users
 * @param {string[]} userIds - Array of user UIDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
export const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  try {
    const sendNotifications = httpsCallable(functions, 'sendNotificationToUsers');
    const result = await sendNotifications({ userIds, title, body, data });
    console.log('Bulk notification sent:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    throw error;
  }
};

/**
 * Notification templates for common scenarios
 */
export const NotificationTemplates = {
  printJobReady: (slotId) => ({
    title: '🖨️ Print Job Ready!',
    body: `Your print job at Slot ${slotId} is ready for pickup!`,
    data: {
      type: 'print_job_ready',
      slotId,
      url: '/student/print'
    }
  }),

  printJobCollected: (slotId) => ({
    title: '✅ Job Collected',
    body: `Print job at Slot ${slotId} has been marked as collected.`,
    data: {
      type: 'print_job_collected',
      slotId,
      url: '/student/print'
    }
  }),

  lectureCancelled: (subject, date) => ({
    title: `❌ Lecture Cancelled: ${subject}`,
    body: `Your ${subject} lecture on ${date} has been cancelled.`,
    data: {
      type: 'lecture_cancelled',
      subject,
      url: '/student/schedule'
    }
  }),

  venueChange: (subject, newVenue) => ({
    title: `📍 Venue Change: ${subject}`,
    body: `${subject} lecture moved to ${newVenue}`,
    data: {
      type: 'venue_change',
      subject,
      venue: newVenue,
      url: '/student/schedule'
    }
  }),

  // Staff notification when new print job submitted
  newPrintJob: (slotId, studentEmail) => ({
    title: '🖨️ New Print Job',
    body: `New print job at Slot ${slotId} from ${studentEmail}`,
    data: {
      type: 'new_print_job',
      slotId,
      url: '/staff/queue'
    }
  })
};