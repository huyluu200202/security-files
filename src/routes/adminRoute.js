const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const User = require('../models/userModel');
const File = require('../models/fileModel');

router.get('/permissions', authorizeAdmin, async (req, res) => {
    try {
        const users = await User.findAll(); 
        const files = await File.findAll(); 
        res.render('admin', { users, files });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.post('/api/permissions/view-download', authorizeAdmin, adminController.assignViewDownloadPermission);
router.delete('/api/users/:userId', authorizeAdmin, adminController.deleteUser);
router.post('/api/permissions/toggle-upload/:userId', authorizeAdmin, adminController.toggleUploadPermission);

module.exports = router;
