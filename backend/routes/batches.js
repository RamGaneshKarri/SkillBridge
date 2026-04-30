const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/batches
 * Create a new batch — Trainer or Institution only
 */
router.post('/', authenticate, requireRole('trainer', 'institution'), async (req, res) => {
  try {
    const { name, trainerIds, studentIds } = req.body;
    console.log(`[Batch Creation] User ${req.user.uid} (${req.user.role}) is creating batch: "${name}"`);

    if (!name || !name.trim()) {
      console.warn('[Batch Creation] Failed: Name is missing');
      return res.status(400).json({ error: 'Batch name is required' });
    }

    // Determine institution ID (if any)
    let institutionId = req.user.institutionId || null;
    if (req.user.role === 'institution') institutionId = req.user.uid;

    const batchData = {
      name: name.trim(),
      trainerIds: trainerIds || (req.user.role === 'trainer' ? [req.user.uid] : []),
      institutionId: institutionId,
      studentIds: studentIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[Batch Creation] Saving to Firestore:', batchData);
    const batchRef = await db.collection('batches').add(batchData);
    console.log(`[Batch Creation] Success! Batch ID: ${batchRef.id}`);

    res.status(201).json({
      id: batchRef.id,
      ...batchData,
      message: 'Batch created successfully'
    });
  } catch (error) {
    console.error('[Batch Creation] CRITICAL ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to create batch',
      details: error.message 
    });
  }
});

/**
 * GET /api/batches
 * Get batches relevant to the user's role
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let batches = [];

    if (req.user.role === 'trainer') {
      // Trainer sees batches they're assigned to
      const snapshot = await db.collection('batches')
        .where('trainerIds', 'array-contains', req.user.uid)
        .get();
      batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.user.role === 'institution') {
      // Institution sees all their batches
      const snapshot = await db.collection('batches')
        .where('institutionId', '==', req.user.uid)
        .get();
      batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.user.role === 'student') {
      // Student sees batches they belong to
      const snapshot = await db.collection('batches')
        .where('studentIds', 'array-contains', req.user.uid)
        .get();
      batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.user.role === 'programme_manager' || req.user.role === 'monitoring_officer') {
      // Programme Manager and Monitoring Officer see all batches
      const snapshot = await db.collection('batches').get();
      batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

/**
 * POST /api/batches/:id/invite
 * Generate a batch invite link — Trainer only
 */
router.post('/:id/invite', authenticate, requireRole('trainer'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify batch exists and trainer is assigned
    const batchDoc = await db.collection('batches').doc(id).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();
    if (!batchData.trainerIds.includes(req.user.uid)) {
      return res.status(403).json({ error: 'You are not assigned to this batch' });
    }

    // Generate unique invite token
    const token = uuidv4();

    const inviteData = {
      batchId: id,
      batchName: batchData.name,
      token,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      active: true,
    };

    await db.collection('invites').add(inviteData);

    res.status(201).json({
      token,
      inviteLink: `/join?token=${token}`,
      message: 'Invite link generated successfully'
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ error: 'Failed to generate invite link' });
  }
});

/**
 * POST /api/batches/:id/join
 * Student joins a batch using invite token
 */
router.post('/:id/join', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { token } = req.body;
    const { id } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    // Find the invite
    const inviteSnapshot = await db.collection('invites')
      .where('token', '==', token)
      .where('batchId', '==', id)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    // Verify batch exists
    const batchRef = db.collection('batches').doc(id);
    const batchDoc = await batchRef.get();

    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // Check if student is already in the batch
    if (batchData.studentIds && batchData.studentIds.includes(req.user.uid)) {
      return res.status(400).json({ error: 'You are already in this batch' });
    }

    // Add student to batch
    const updatedStudentIds = [...(batchData.studentIds || []), req.user.uid];
    await batchRef.update({ studentIds: updatedStudentIds });

    res.json({
      message: 'Successfully joined batch',
      batchName: batchData.name,
      batchId: id
    });
  } catch (error) {
    console.error('Join batch error:', error);
    res.status(500).json({ error: 'Failed to join batch' });
  }
});

/**
 * POST /api/batches/join-by-token
 * Student joins a batch using only the invite token (without knowing batch ID)
 */
router.post('/join-by-token', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    // Find the invite by token
    const inviteSnapshot = await db.collection('invites')
      .where('token', '==', token)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (inviteSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    const inviteData = inviteSnapshot.docs[0].data();
    const batchId = inviteData.batchId;

    // Verify batch exists
    const batchRef = db.collection('batches').doc(batchId);
    const batchDoc = await batchRef.get();

    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // Check if student is already in the batch
    if (batchData.studentIds && batchData.studentIds.includes(req.user.uid)) {
      return res.status(400).json({ error: 'You are already in this batch' });
    }

    // Add student to batch
    const updatedStudentIds = [...(batchData.studentIds || []), req.user.uid];
    await batchRef.update({ studentIds: updatedStudentIds });

    res.json({
      message: 'Successfully joined batch',
      batchName: batchData.name,
      batchId
    });
  } catch (error) {
    console.error('Join batch by token error:', error);
    res.status(500).json({ error: 'Failed to join batch' });
  }
});

/**
 * PUT /api/batches/:id/trainers
 * Add a trainer to a batch — Institution only
 */
router.put('/:id/trainers', authenticate, requireRole('institution'), async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const batchRef = db.collection('batches').doc(id);
    const batchDoc = await batchRef.get();

    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // Verify this batch belongs to the institution
    if (batchData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'This batch does not belong to your institution' });
    }

    // Verify trainer exists and has trainer role
    const trainerDoc = await db.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists || trainerDoc.data().role !== 'trainer') {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Add trainer to batch
    const updatedTrainerIds = [...new Set([...(batchData.trainerIds || []), trainerId])];
    await batchRef.update({ trainerIds: updatedTrainerIds });

    // Update trainer's institutionId
    await db.collection('users').doc(trainerId).update({ institutionId: req.user.uid });

    res.json({ message: 'Trainer added to batch successfully' });
  } catch (error) {
    console.error('Add trainer error:', error);
    res.status(500).json({ error: 'Failed to add trainer to batch' });
  }
});

/**
 * PUT /api/batches/:id
 * Update batch details — Trainer or Institution only
 */
router.put('/:id', authenticate, requireRole('trainer', 'institution'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trainerIds, studentIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Batch name is required' });
    }

    const batchRef = db.collection('batches').doc(id);
    const batchDoc = await batchRef.get();

    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // Authorization check: Only assigned trainers or the owning institution can edit
    const isInstitutionOwner = req.user.role === 'institution' && batchData.institutionId === req.user.uid;
    const isAssignedTrainer = req.user.role === 'trainer' && batchData.trainerIds.includes(req.user.uid);

    if (!isInstitutionOwner && !isAssignedTrainer) {
      return res.status(403).json({ error: 'You do not have permission to edit this batch' });
    }

    const updateData = { name: name.trim() };
    if (trainerIds !== undefined) updateData.trainerIds = trainerIds;
    if (studentIds !== undefined) updateData.studentIds = studentIds;

    await batchRef.update(updateData);

    res.json({ message: 'Batch updated successfully', name: name.trim() });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ error: 'Failed to update batch', details: error.message });
  }
});

/**
 * DELETE /api/batches/:id
 * Delete a batch — Trainer or Institution only
 */
router.delete('/:id', authenticate, requireRole('trainer', 'institution'), async (req, res) => {
  try {
    const { id } = req.params;

    const batchRef = db.collection('batches').doc(id);
    const batchDoc = await batchRef.get();

    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // Authorization check
    const isInstitutionOwner = req.user.role === 'institution' && batchData.institutionId === req.user.uid;
    const isAssignedTrainer = req.user.role === 'trainer' && batchData.trainerIds.includes(req.user.uid);

    if (!isInstitutionOwner && !isAssignedTrainer) {
      return res.status(403).json({ error: 'You do not have permission to delete this batch' });
    }

    // Delete the batch
    await batchRef.delete();

    // Note: In a production app, we should also delete related sessions and attendance
    // but for simplicity here we just delete the batch.
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch', details: error.message });
  }
});

module.exports = router;
