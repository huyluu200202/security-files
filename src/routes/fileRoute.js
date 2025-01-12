const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const File = require('../models/fileModel');
const Permission = require('../models/permissionModel');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.get('/upload', (req, res) => {
    res.render('upload');
});

router.get('/uploads/delete/:fileName', async (req, res) => {
    const { fileName } = req.params;

    try {
        const file = await File.findOne({ where: { fileName: fileName } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);

        await fs.promises.unlink(filePath);

        await file.destroy();
        res.redirect('/');
    } catch (error) {
        console.error('File deletion failed:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
});

router.post('/api/upload', authenticate, upload.single('file'), fileController.uploadFile);

router.get('/api/view/:fileId', authenticate, async (req, res) => {
    const { role } = req.user;
    const { fileId } = req.params;

    try {
        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (role !== 'admin') {
            const permission = await Permission.findOne({
                where: { user_id: role, file_id: file.id }
            });

            if (!permission || !permission.can_view) {
                return res.status(403).json({ message: 'You do not have permission to view this file.' });
            }
        }

        fileController.viewFile(req, res);
    } catch (error) {
        console.error('Error viewing file:', error);
        res.status(500).json({ error: 'Failed to view file' });
    }
});

router.get('/api/download/:filename', authenticate, async (req, res) => {
    const { role } = req.user;
    const { filename } = req.params;

    try {
        const file = await File.findOne({ where: { fileName: filename } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (role !== 'admin') {
            const permission = await Permission.findOne({
                where: { user_id: role, file_id: file.id }
            });

            if (!permission || !permission.can_download) {
                return res.status(403).json({ message: 'You do not have permission to download this file.' });
            }
        }

        fileController.downloadFile(req, res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

module.exports = router;