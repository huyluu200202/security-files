const express = require('express');
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const File = require('../models/fileModel');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

router.get('/upload', (req, res) => {
    res.render('upload');
});
router.post('/api/upload', authenticate, upload.single('file'), fileController.uploadFile);
router.get('/api/public-files', authenticate, async (req, res) => {
    try {
        const publicFiles = await File.findAll({ where: { isPublic: true } });

        res.json(publicFiles);
    } catch (error) {
        console.error('Error fetching public files:', error.message);
        res.status(500).json({ error: 'Failed to fetch public files' });
    }
});

router.get('/preview/:fileName', fileController.previewFile);
router.get('/delete/:fileName', fileController.deleteFile);
router.get('/download/:fileName', fileController.downloadFile);

module.exports = router;
