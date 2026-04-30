const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

/**
 * POST /api/sessions
 * Create a new session — Trainer only
 */
router.post('/', authenticate, requireRole('trainer'), async (req, res) => {
  try {
    const { title, date, startTime, endTime, batchId } = req.body;

    // Validate required fields
    if (!title || !date || !startTime || !endTime || !batchId) {
      return res.status(400).json({ 
        error: 'All fields are required: title, date, startTime, endTime, batchId' 
      });
    }

    // Verify batch exists and trainer is assigned to it
    const batchDoc = await db.collection('batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();
    if (!batchData.trainerIds || !batchData.trainerIds.includes(req.user.uid)) {
      return res.status(403).json({ error: 'You are not assigned to this batch' });
    }

    const sessionData = {
      title: title.trim(),
      date,
      startTime,
      endTime,
      batchId,
      batchName: batchData.name,
      trainerId: req.user.uid,
      trainerName: req.user.name,
      createdAt: new Date().toISOString(),
    };

    console.log(`Creating session for user: ${req.user.uid}`);
    console.log('Session data:', sessionData);

    const sessionRef = await db.collection('sessions').add(sessionData);

    console.log(`✅ Session created with ID: ${sessionRef.id}`);

    res.status(201).json({
      id: sessionRef.id,
      ...sessionData,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('❌ Create session error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message
    });
  }
});

/**
 * GET /api/sessions
 * Get sessions relevant to the user's role
 * NOTE: We avoid .orderBy() to skip Firestore composite index requirements.
 *       Instead we sort in-memory after fetching.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let sessions = [];

    if (req.user.role === 'trainer') {
      // Trainer sees sessions they created
      const snapshot = await db.collection('sessions')
        .where('trainerId', '==', req.user.uid)
        .get();
      sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.user.role === 'student') {
      // Student sees sessions for batches they're in
      const batchSnapshot = await db.collection('batches')
        .where('studentIds', 'array-contains', req.user.uid)
        .get();
      
      const batchIds = batchSnapshot.docs.map(doc => doc.id);
      
      if (batchIds.length > 0) {
        // Firestore 'in' queries support max 30 values
        const chunks = [];
        for (let i = 0; i < batchIds.length; i += 30) {
          chunks.push(batchIds.slice(i, i + 30));
        }
        
        for (const chunk of chunks) {
          const sessionSnapshot = await db.collection('sessions')
            .where('batchId', 'in', chunk)
            .get();
          sessions.push(...sessionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }

    } else if (req.user.role === 'institution') {
      // Institution sees sessions for their batches
      const batchSnapshot = await db.collection('batches')
        .where('institutionId', '==', req.user.uid)
        .get();
      
      const batchIds = batchSnapshot.docs.map(doc => doc.id);
      
      if (batchIds.length > 0) {
        const chunks = [];
        for (let i = 0; i < batchIds.length; i += 30) {
          chunks.push(batchIds.slice(i, i + 30));
        }
        
        for (const chunk of chunks) {
          const sessionSnapshot = await db.collection('sessions')
            .where('batchId', 'in', chunk)
            .get();
          sessions.push(...sessionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }

    } else if (req.user.role === 'programme_manager' || req.user.role === 'monitoring_officer') {
      // PM and MO see all sessions
      const snapshot = await db.collection('sessions').get();
      sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Sort by date descending in-memory (avoids Firestore index requirement)
    sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/sessions/:id/attendance
 * View full attendance for a session — Trainer, Institution, PM, MO
 */
router.get('/:id/attendance', authenticate, requireRole('trainer', 'institution', 'programme_manager', 'monitoring_officer'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify session exists
    const sessionDoc = await db.collection('sessions').doc(id).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();

    // Trainer can only view attendance for their own sessions
    if (req.user.role === 'trainer' && sessionData.trainerId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only view attendance for your own sessions' });
    }

    // Fetch attendance records for this session
    const attendanceSnapshot = await db.collection('attendance')
      .where('sessionId', '==', id)
      .get();

    const attendanceRecords = [];
    for (const doc of attendanceSnapshot.docs) {
      const record = doc.data();
      // Get student name
      const studentDoc = await db.collection('users').doc(record.studentId).get();
      attendanceRecords.push({
        id: doc.id,
        ...record,
        studentName: studentDoc.exists ? studentDoc.data().name : 'Unknown',
        studentEmail: studentDoc.exists ? studentDoc.data().email : 'Unknown',
      });
    }

    // Get batch info for the list of students
    const batchDoc = await db.collection('batches').doc(sessionData.batchId).get();
    const batchData = batchDoc.exists ? batchDoc.data() : null;
    const totalStudents = batchData ? (batchData.studentIds || []).length : 0;

    res.json({
      session: { id, ...sessionData },
      attendance: attendanceRecords,
      totalStudents,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      absentCount: attendanceRecords.filter(r => r.status === 'absent').length,
      lateCount: attendanceRecords.filter(r => r.status === 'late').length,
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * PUT /api/sessions/:id
 * Update session details — Trainer only
 */
router.put('/:id', authenticate, requireRole('trainer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, startTime, endTime, batchId } = req.body;

    if (!title || !date || !startTime || !endTime || !batchId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sessionRef = db.collection('sessions').doc(id);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();

    // Authorization check
    if (sessionData.trainerId !== req.user.uid) {
      return res.status(403).json({ error: 'You do not have permission to edit this session' });
    }

    // Verify batch if it changed
    let batchName = sessionData.batchName;
    if (batchId !== sessionData.batchId) {
      const batchDoc = await db.collection('batches').doc(batchId).get();
      if (!batchDoc.exists) return res.status(404).json({ error: 'New batch not found' });
      batchName = batchDoc.data().name;
    }

    const updatedData = {
      title: title.trim(),
      date,
      startTime,
      endTime,
      batchId,
      batchName,
      updatedAt: new Date().toISOString(),
    };

    await sessionRef.update(updatedData);

    res.json({ message: 'Session updated successfully', ...updatedData });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session', details: error.message });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete a session — Trainer only
 */
router.delete('/:id', authenticate, requireRole('trainer'), async (req, res) => {
  try {
    const { id } = req.params;

    const sessionRef = db.collection('sessions').doc(id);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();

    // Authorization check
    if (sessionData.trainerId !== req.user.uid) {
      return res.status(403).json({ error: 'You do not have permission to delete this session' });
    }

    // Delete the session
    await sessionRef.delete();

    // Delete associated attendance
    const attendanceSnapshot = await db.collection('attendance')
      .where('sessionId', '==', id)
      .get();
    
    const batch = db.batch();
    attendanceSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session', details: error.message });
  }
});

module.exports = router;
