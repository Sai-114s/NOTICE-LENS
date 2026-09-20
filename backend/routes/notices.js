const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { validateNoticePayload, validateExtractionPayload } = require('../middleware/validator');
const { requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/', noticeController.getNotices);
router.post('/extract', requireAdmin, validateExtractionPayload, noticeController.extractNoticeCandidate);
router.get('/:id/impact', requireAdmin, noticeController.getNoticeImpact);
router.get('/:id', noticeController.getNoticeById);
router.post('/', requireAdmin, validateNoticePayload, noticeController.createNotice);
router.put('/:id', requireAdmin, validateNoticePayload, noticeController.updateNotice);
router.post('/:id/publish', requireAdmin, noticeController.publishNotice);
router.post('/:id/action-items/:itemId/complete', requireStudent, noticeController.completeActionItem);

module.exports = router;
