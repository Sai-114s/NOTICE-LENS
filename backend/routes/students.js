const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const eligibilityController = require('../controllers/eligibilityController');
const { validateStudentPayload } = require('../middleware/validator');
const { requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/', studentController.getStudents);
router.get('/:id', requireStudent, studentController.getStudentById);
router.put('/:id', requireAdmin, validateStudentPayload, studentController.updateStudent);

// Student notices / dashboard and detail view routes
router.post('/:id/dashboard', requireStudent, eligibilityController.getStudentDashboardNotices); // Support POST for legacy body passing
router.get('/:id/notices', requireStudent, eligibilityController.getStudentDashboardNotices);
router.post('/:studentId/notices/:noticeId', requireStudent, eligibilityController.getStudentNoticeDetail); // Support POST for legacy body passing
router.get('/:studentId/notices/:noticeId', requireStudent, eligibilityController.getStudentNoticeDetail);

module.exports = router;
