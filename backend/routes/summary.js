const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

/**
 * GET /api/batches/:id/summary
 * Attendance summary for a batch — Institution, PM, MO
 */
router.get('/batches/:id/summary', authenticate, requireRole('institution', 'programme_manager', 'monitoring_officer'), async (req, res) => {
  try {
    const { id } = req.params;

    const batchDoc = await db.collection('batches').doc(id).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batchData = batchDoc.data();

    // If institution, verify it belongs to them
    if (req.user.role === 'institution' && batchData.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'This batch does not belong to your institution' });
    }

    // Get all sessions for this batch
    const sessionsSnapshot = await db.collection('sessions')
      .where('batchId', '==', id)
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get attendance for all sessions
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalRecords = 0;

    for (const session of sessions) {
      const attendanceSnapshot = await db.collection('attendance')
        .where('sessionId', '==', session.id)
        .get();

      attendanceSnapshot.docs.forEach(doc => {
        const record = doc.data();
        totalRecords++;
        if (record.status === 'present') totalPresent++;
        else if (record.status === 'absent') totalAbsent++;
        else if (record.status === 'late') totalLate++;
      });
    }

    const totalStudents = (batchData.studentIds || []).length;
    const attendanceRate = totalRecords > 0
      ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
      : 0;

    res.json({
      batch: { id, name: batchData.name },
      totalStudents,
      totalSessions: sessions.length,
      totalRecords,
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate,
    });
  } catch (error) {
    console.error('Batch summary error:', error);
    res.status(500).json({ error: 'Failed to fetch batch summary' });
  }
});

/**
 * GET /api/institutions/:id/summary
 * Attendance summary across all batches in an institution — PM, MO
 */
router.get('/institutions/:id/summary', authenticate, requireRole('institution', 'programme_manager', 'monitoring_officer'), async (req, res) => {
  try {
    const { id } = req.params;

    // If institution, verify it's their own data
    if (req.user.role === 'institution' && id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get institution user info
    const institutionDoc = await db.collection('users').doc(id).get();
    const institutionName = institutionDoc.exists ? institutionDoc.data().name : 'Unknown Institution';

    // Get all batches for this institution
    const batchesSnapshot = await db.collection('batches')
      .where('institutionId', '==', id)
      .get();

    const batchSummaries = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalRecords = 0;
    let allInstitutionStudentIds = new Set();
    let totalSessions = 0;

    for (const batchDoc of batchesSnapshot.docs) {
      const batchData = batchDoc.data();
      const batchStudentIds = batchData.studentIds || [];
      batchStudentIds.forEach(id => allInstitutionStudentIds.add(id));

      // Get sessions for this batch
      const sessionsSnapshot = await db.collection('sessions')
        .where('batchId', '==', batchDoc.id)
        .get();

      totalSessions += sessionsSnapshot.docs.length;
      let batchPresent = 0;
      let batchAbsent = 0;
      let batchLate = 0;
      let batchRecords = 0;

      for (const sessionDoc of sessionsSnapshot.docs) {
        const attendanceSnapshot = await db.collection('attendance')
          .where('sessionId', '==', sessionDoc.id)
          .get();

        attendanceSnapshot.docs.forEach(doc => {
          const record = doc.data();
          batchRecords++;
          totalRecords++;
          if (record.status === 'present') { batchPresent++; totalPresent++; }
          else if (record.status === 'absent') { batchAbsent++; totalAbsent++; }
          else if (record.status === 'late') { batchLate++; totalLate++; }
        });
      }

      batchSummaries.push({
        batchId: batchDoc.id,
        batchName: batchData.name,
        totalStudents: batchStudentIds.length,
        totalSessions: sessionsSnapshot.docs.length,
        totalPresent: batchPresent,
        totalAbsent: batchAbsent,
        totalLate: batchLate,
        attendanceRate: batchRecords > 0
          ? Math.round(((batchPresent + batchLate) / batchRecords) * 100)
          : 0,
      });
    }

    const overallRate = totalRecords > 0
      ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
      : 0;

    res.json({
      institutionId: id,
      institutionName,
      totalBatches: batchesSnapshot.docs.length,
      totalStudents: allInstitutionStudentIds.size,
      totalSessions,
      totalRecords,
      totalPresent,
      totalAbsent,
      totalLate,
      overallAttendanceRate: overallRate,
      batchSummaries,
    });
  } catch (error) {
    console.error('Institution summary error:', error);
    res.status(500).json({ error: 'Failed to fetch institution summary' });
  }
});

/**
 * GET /api/programme/summary
 * Programme-wide attendance summary — PM and MO
 */
router.get('/programme/summary', authenticate, requireRole('programme_manager', 'monitoring_officer'), async (req, res) => {
  try {
    // Get all institutions
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institution')
      .get();

    const institutionSummaries = [];
    let grandTotalPresent = 0;
    let grandTotalAbsent = 0;
    let grandTotalLate = 0;
    let grandTotalRecords = 0;
    let grandTotalStudents = 0;
    let grandTotalSessions = 0;
    let grandTotalBatches = 0;

    for (const instDoc of institutionsSnapshot.docs) {
      const instData = instDoc.data();

      // Get batches for this institution
      const batchesSnapshot = await db.collection('batches')
        .where('institutionId', '==', instDoc.id)
        .get();

      let instPresent = 0;
      let instAbsent = 0;
      let instLate = 0;
      let instRecords = 0;
      let instStudents = 0;
      let instSessions = 0;

      grandTotalBatches += batchesSnapshot.docs.length;

      for (const batchDoc of batchesSnapshot.docs) {
        const batchData = batchDoc.data();
        instStudents += (batchData.studentIds || []).length;

        const sessionsSnapshot = await db.collection('sessions')
          .where('batchId', '==', batchDoc.id)
          .get();

        instSessions += sessionsSnapshot.docs.length;

        for (const sessionDoc of sessionsSnapshot.docs) {
          const attendanceSnapshot = await db.collection('attendance')
            .where('sessionId', '==', sessionDoc.id)
            .get();

          attendanceSnapshot.docs.forEach(doc => {
            const record = doc.data();
            instRecords++;
            if (record.status === 'present') instPresent++;
            else if (record.status === 'absent') instAbsent++;
            else if (record.status === 'late') instLate++;
          });
        }
      }

      grandTotalPresent += instPresent;
      grandTotalAbsent += instAbsent;
      grandTotalLate += instLate;
      grandTotalRecords += instRecords;
      grandTotalStudents += instStudents;
      grandTotalSessions += instSessions;

      institutionSummaries.push({
        institutionId: instDoc.id,
        institutionName: instData.name,
        totalBatches: batchesSnapshot.docs.length,
        totalStudents: instStudents,
        totalSessions: instSessions,
        totalPresent: instPresent,
        totalAbsent: instAbsent,
        totalLate: instLate,
        attendanceRate: instRecords > 0
          ? Math.round(((instPresent + instLate) / instRecords) * 100)
          : 0,
      });
    }

    const overallRate = grandTotalRecords > 0
      ? Math.round(((grandTotalPresent + grandTotalLate) / grandTotalRecords) * 100)
      : 0;

    res.json({
      totalInstitutions: institutionsSnapshot.docs.length,
      totalBatches: grandTotalBatches,
      totalStudents: grandTotalStudents,
      totalSessions: grandTotalSessions,
      totalRecords: grandTotalRecords,
      totalPresent: grandTotalPresent,
      totalAbsent: grandTotalAbsent,
      totalLate: grandTotalLate,
      overallAttendanceRate: overallRate,
      institutionSummaries,
    });
  } catch (error) {
    console.error('Programme summary error:', error);
    res.status(500).json({ error: 'Failed to fetch programme summary' });
  }
});

module.exports = router;
