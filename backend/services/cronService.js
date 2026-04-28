const cron = require('node-cron');
const Case = require('../models/Case');
const Notification = require('../models/Notification');

/**
 * Initialize cron jobs for reminders
 */
exports.initCron = (io) => {
  // Run every hour to check for court dates in the next 24 hours
  cron.schedule('0 * * * *', async () => {
    console.log('Running Court Date Reminder Check...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find cases with upcoming court dates that haven't been notified yet
      const cases = await Case.find({
        'courtDates': {
          $elemMatch: {
            date: { $lte: tomorrow, $gt: new Date() },
            isNotified: false
          }
        }
      }).populate('postedBy assignedLawyer');

      for (const caseItem of cases) {
        for (const cd of caseItem.courtDates) {
          if (cd.date <= tomorrow && cd.date > new Date() && !cd.isNotified) {
            
            // Notify Client
            const clientNotify = await Notification.create({
              user: caseItem.postedBy._id,
              type: 'court_reminder',
              title: 'Upcoming Court Hearing',
              message: `Reminder: You have a court hearing "${cd.title}" scheduled for tomorrow at ${cd.date.toLocaleTimeString()}.`,
              link: `/cases/${caseItem._id}`
            });

            // Notify Lawyer
            let lawyerNotify;
            if (caseItem.assignedLawyer) {
              lawyerNotify = await Notification.create({
                user: caseItem.assignedLawyer._id,
                type: 'court_reminder',
                title: 'Upcoming Court Hearing',
                message: `Reminder: Case "${caseItem.title}" has a court hearing "${cd.title}" tomorrow at ${cd.date.toLocaleTimeString()}.`,
                link: `/cases/${caseItem._id}`
              });
            }

            // Emit via Socket.io
            if (io) {
              io.to(caseItem.postedBy._id.toString()).emit('newNotification', clientNotify);
              if (caseItem.assignedLawyer) {
                io.to(caseItem.assignedLawyer._id.toString()).emit('newNotification', lawyerNotify);
              }
            }

            cd.isNotified = true;
          }
        }
        await caseItem.save();
      }
    } catch (err) {
      console.error('Cron reminder error:', err);
    }
  });

  console.log('Reminder Cron Job Initialized.');
};
