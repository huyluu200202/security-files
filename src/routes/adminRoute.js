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

router.post('/api/permissions', authorizeAdmin, adminController.assignPermission);

router.get('/permissions/list', authorizeAdmin, adminController.getPermissions);

router.get('/permissions/user/:userId', authorizeAdmin, adminController.getUserPermissions);

router.delete('/api/permissions/:permissionId', authorizeAdmin, adminController.deletePermission);

module.exports = router;
