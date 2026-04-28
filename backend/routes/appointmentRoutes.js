const express = require('express');
const router = express.Router();
const { bookAppointment, getMyAppointments, updateAppointment, getAppointmentById } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All appointment routes are protected

router.route('/')
  .post(bookAppointment)
  .get(getMyAppointments);

router.route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment);

module.exports = router;
