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

router.get('/adminFiles', authorizeAdmin, async (req, res) => {
    try {
        const adminUser = await User.findOne({ where: { username: 'admin' } });
        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user not found' });
        }
        const adminUserId = adminUser.id;

        const users = await User.findAll();
        const files = await File.findAll();

        res.render('adminFiles', { users, files, adminUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.post('/api/make-public/:fileId', authorizeAdmin, async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isPublic = !file.isPublic;
        await file.save();

        res.json({ message: 'File status updated successfully', isPublic: file.isPublic });
    } catch (error) {
        console.error('Error updating file status:', error.message);
        res.status(500).json({ error: 'Failed to update file status' });
    }

});

router.get('/api/permissions/view-download', adminController.checkViewDownloadPermission);
router.post('/api/permissions/view-download', authorizeAdmin, adminController.assignViewDownloadPermission);
router.delete('/api/users/:userId', authorizeAdmin, adminController.deleteUser);

module.exports = router;