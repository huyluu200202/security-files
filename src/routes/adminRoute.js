const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const User = require('../models/userModel');
const File = require('../models/fileModel');

router.get('/permissions', authorizeAdmin, async (req, res) => {
    try {
        const adminUser = await User.findOne({ where: { username: 'admin' } });
        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user not found' });
        }
        const adminUserId = adminUser.id;

        const users = await User.findAll();
        const files = await File.findAll();

        res.render('admin', { users, files, adminUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.post('/api/permissions/view-download', authorizeAdmin, adminController.assignViewDownloadPermission);
router.delete('/api/users/:userId', authorizeAdmin, adminController.deleteUser);
module.exports = router;
