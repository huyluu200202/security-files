const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const File = require('../models/fileModel'); 
const checkPermissions = require('../middlewares/checkPermissions');

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

router.get('/uploads/:filename', authenticate, checkPermissions('can_download'), async (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found:', filePath);
            return res.status(404).send('File not found');
        }
        res.download(filePath);
    });
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

router.get('/api/view/:fileId', authenticate, checkPermissions('can_view'), fileController.viewFile);
router.get('/api/download/:filename', authenticate, checkPermissions('can_download'), fileController.downloadFile);

module.exports = router;