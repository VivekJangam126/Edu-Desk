const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  runFullMigration,
  migrateAcademicData,
  migrateUserData,
  migrateNotesData,
  migrateInteractions,
  getMigrationStatus
} = require('../services/migration');

const router = express.Router();

// Middleware to check if user is admin (you might want to implement proper admin check)
const requireAdmin = (req, res, next) => {
  // For now, just require authentication - in production, check for admin role
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get migration status
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = await getMigrationStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting migration status:', error);
    res.status(500).json({ error: 'Failed to get migration status' });
  }
});

// Run full migration
router.post('/full', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(`Migration initiated by user: ${req.user.id}`);
    const result = await runFullMigration();
    res.json({
      message: 'Full migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Full migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// Migrate academic data only
router.post('/academic', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await migrateAcademicData();
    res.json({
      message: 'Academic data migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Academic migration failed:', error);
    res.status(500).json({ 
      error: 'Academic migration failed', 
      details: error.message 
    });
  }
});

// Migrate user data only
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await migrateUserData();
    res.json({
      message: 'User data migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('User migration failed:', error);
    res.status(500).json({ 
      error: 'User migration failed', 
      details: error.message 
    });
  }
});

// Migrate notes and files only
router.post('/notes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await migrateNotesData();
    res.json({
      message: 'Notes data migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Notes migration failed:', error);
    res.status(500).json({ 
      error: 'Notes migration failed', 
      details: error.message 
    });
  }
});

// Migrate interactions (comments, ratings, favorites) only
router.post('/interactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await migrateInteractions();
    res.json({
      message: 'Interactions migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Interactions migration failed:', error);
    res.status(500).json({ 
      error: 'Interactions migration failed', 
      details: error.message 
    });
  }
});

module.exports = router;