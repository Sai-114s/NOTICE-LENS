const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const noticeRoutes = require('./routes/notices');
const studentRoutes = require('./routes/students');
const eligibilityRoutes = require('./routes/eligibility');

const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Middleware
app.use(cors());
app.use(express.json({ strict: true, limit: '15mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: "ok",
        service: "NoticeLens Backend",
        demoMode: DEMO_MODE,
        timestamp: new Date().toISOString()
    });
});

// Legacy status check for frontend compatibility
app.get('/api/engine/status', async (req, res, next) => {
    try {
        const { evaluateEligibility } = require('./utils/engineBridge');
        const dummyCriteria = { min_cgpa: null, eligible_branches: null, eligible_years: null, max_active_backlogs: null };
        const dummyStudent = { student_id: "test", cgpa: 10, branch: "CSE", year: 2026, active_backlogs: 0 };
        
        await evaluateEligibility(dummyCriteria, dummyStudent);
        res.json({ status: "ok", message: "Python Eligibility Engine reachable" });
    } catch (error) {
        next(error);
    }
});

// Mount Routes
app.use('/api/notices', noticeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/eligibility', eligibilityRoutes);

// Global Error Handler
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

module.exports = app;
