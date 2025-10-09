const express = require('express');
const router = express.Router();

// Launch project endpoint for web-to-overlay communication
router.post('/launch-project', async (req, res) => {
  try {
    const { projectId, userId, timestamp } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId and userId are required' 
      });
    }

    console.log(`[Launch] Received launch request for project ${projectId} from user ${userId}`);

    // Emit event to the main process to launch the overlay
    req.bridge.emit('launch-project', {
      projectId,
      userId,
      timestamp,
      source: 'web'
    });

    // Return success response
    res.json({
      success: true,
      message: 'Project launch request received',
      projectId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Launch] Error handling launch request:', error);
    res.status(500).json({ 
      error: 'Failed to process launch request',
      details: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'launch-api'
  });
});

module.exports = router;
