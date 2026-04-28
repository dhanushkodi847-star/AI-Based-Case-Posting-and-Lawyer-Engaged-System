const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Book an appointment
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { lawyerId, caseId, title, description, dateTime, duration, type, location } = req.body;

    if (!lawyerId || !dateTime || !title) {
      return res.status(400).json({ success: false, message: 'Please provide lawyerId, dateTime and title' });
    }

    // Check if lawyer exists
    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    const appointment = await Appointment.create({
      client: req.user._id,
      lawyer: lawyerId,
      caseRef: caseId,
      title,
      description,
      dateTime,
      type: type || 'online',
      location,
      consultationFee: (type === 'offline') ? 0 : (lawyer.consultationFee || 0),
      paymentStatus: (type === 'offline') ? 'not_required' : 'unpaid'
    });

    // Notify lawyer
    try {
      const notification = await Notification.create({
        user: lawyerId,
        type: 'appointment_request',
        title: 'New Appointment Request',
        message: `${req.user.name} has requested an appointment on ${new Date(dateTime).toLocaleString()}`,
        link: `/appointments/${appointment._id}`
      });

      const io = req.app.get('io');
      if (io) {
        io.to(lawyerId.toString()).emit('newNotification', notification);
      }
    } catch (err) {
      console.error('Appointment notification failed:', err);
    }

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my appointments
// @route   GET /api/appointments
exports.getMyAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'lawyer') {
      query = { lawyer: req.user._id };
    } else if (req.user.role === 'admin') {
      query = {}; // Admin sees all
    } else {
      query = { client: req.user._id };
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'name email phone avatar')
      .populate('lawyer', 'name email phone avatar specializations consultationFee')
      .populate('caseRef', 'title category')
      .sort({ dateTime: 1 });

    console.log(`Found ${appointments.length} appointments for ${req.user.name} (${req.user.role})`);
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status/details
// @route   PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
  try {
    const { status, meetingLink, notes, dateTime } = req.body;
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Authorization check
    if (appointment.lawyer.toString() !== req.user._id.toString() && appointment.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (meetingLink) updateData.meetingLink = meetingLink;
    if (notes) updateData.notes = notes;
    if (dateTime) updateData.dateTime = dateTime;

    appointment = await Appointment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Notify other party of status change
    try {
      const otherUserId = req.user.role === 'lawyer' ? appointment.client : appointment.lawyer;
      const notification = await Notification.create({
        user: otherUserId,
        type: 'appointment_update',
        title: 'Appointment Updated',
        message: `Your appointment status has been updated to: ${status || 'modified'}`,
        link: `/appointments/${appointment._id}`
      });

      const io = req.app.get('io');
      if (io) {
        io.to(otherUserId.toString()).emit('newNotification', notification);
      }
    } catch (err) {
      console.error('Status update notification failed:', err);
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('client', 'name email phone avatar')
      .populate('lawyer', 'name email phone avatar specializations consultationFee')
      .populate('caseRef', 'title category');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.lawyer._id.toString() !== req.user._id.toString() && 
        appointment.client._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
