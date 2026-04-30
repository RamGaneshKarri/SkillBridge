const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

/**
 * POST /api/attendance/mark
 * Student marks their own attendance for a session
 */
router.post('/mark', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { sessionId, status } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const validStatuses = ['present', 'absent', 'late'];
    const attendanceStatus = status || 'present';
    
    if (!validStatuses.includes(attendanceStatus)) {
      return res.status(400).json({ error: 'Status must be: present, absent, or late' });
    }

    // Verify session exists
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();

    // Verify student is in the batch for this session
    const batchDoc = await db.collection('batches').doc(sessionData.batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();
    if (!batchData.studentIds || !batchData.studentIds.includes(req.user.uid)) {
      return res.status(403).json({ error: 'You are not enrolled in this batch' });
    }

    // Check if already marked attendance for this session
    const existingAttendance = await db.collection('attendance')
      .where('sessionId', '==', sessionId)
      .where('studentId', '==', req.user.uid)
      .limit(1)
      .get();

    if (!existingAttendance.empty) {
      // Update existing attendance
      const existingDoc = existingAttendance.docs[0];
      await existingDoc.ref.update({
        status: attendanceStatus,
        markedAt: new Date().toISOString(),
      });

      return res.json({
        id: existingDoc.id,
        message: 'Attendance updated successfully',
        status: attendanceStatus,
      });
    }

    // Create new attendance record
    const attendanceData = {
      sessionId,
      studentId: req.user.uid,
      studentName: req.user.name,
      status: attendanceStatus,
      markedAt: new Date().toISOString(),
    };

    const attendanceRef = await db.collection('attendance').add(attendanceData);

    res.status(201).json({
      id: attendanceRef.id,
      ...attendanceData,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

/**
 * GET /api/attendance/my
 * Student views their own attendance records
 */
router.get('/my', authenticate, requireRole('student'), async (req, res) => {
  try {
    const snapshot = await db.collection('attendance')
      .where('studentId', '==', req.user.uid)
      .get();

    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(records);
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

module.exports = router;
