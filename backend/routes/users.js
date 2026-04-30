const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/users/public/institutions
 * Public endpoint to get list of institutions for signup page
 */
router.get('/public/institutions', async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'institution')
      .get();
      
    // Only send non-sensitive data
    const institutions = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      name: doc.data().name 
    }));
    res.json(institutions);
  } catch (error) {
    console.error('Get public institutions error:', error);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

/**
 * GET /api/users/me
 * Get current user's profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      uid: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      institutionId: req.user.institutionId || null,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * POST /api/users/register
 * Register a new user profile in Firestore after Firebase Auth signup
 */
router.post('/register', authenticate, async (req, res) => {
  try {
    const { name, role, institutionId } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const validRoles = ['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user profile already exists
    const existingUser = await db.collection('users').doc(req.user.uid).get();
    if (existingUser.exists) {
      return res.status(400).json({ error: 'User profile already exists' });
    }

    const userData = {
      uid: req.user.uid,
      name: name.trim(),
      email: req.user.email,
      role,
      institutionId: institutionId || null,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(req.user.uid).set(userData);

    res.status(201).json({
      ...userData,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * GET /api/users/trainers
 * Get all trainers — for Institution to manage
 */
router.get('/trainers', authenticate, async (req, res) => {
  try {
    let query = db.collection('users').where('role', '==', 'trainer');
    
    // If institution, show trainers linked to them OR unassigned trainers
    if (req.user.role === 'institution') {
      const assignedSnapshot = await db.collection('users')
        .where('role', '==', 'trainer')
        .where('institutionId', '==', req.user.uid)
        .get();
      
      const unassignedSnapshot = await db.collection('users')
        .where('role', '==', 'trainer')
        .where('institutionId', '==', null)
        .get();

      const trainers = [
        ...assignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), assigned: true })),
        ...unassignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), assigned: false })),
      ];

      return res.json(trainers);
    }

    const snapshot = await query.get();
    const trainers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(trainers);
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});

/**
 * GET /api/users/students
 * Get all students — for Institution to manage
 */
router.get('/students', authenticate, async (req, res) => {
  try {
    let query = db.collection('users').where('role', '==', 'student');
    
    if (req.user.role === 'institution') {
      const assignedSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('institutionId', '==', req.user.uid)
        .get();
      
      const students = assignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), assigned: true }));
      return res.json(students);
    }

    const snapshot = await query.get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/users/institutions
 * Get all institutions — for Programme Manager
 */
router.get('/institutions', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'institution')
      .get();

    const institutions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(institutions);
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

module.exports = router;
