const express = require('express');
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const File = require('../models/fileModel');
// const uploadFileCheck = require('../middlewares/uploadFileCheck');

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

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
}).single('file');

router.get('/upload', (req, res) => {
    res.render('upload');
});

// Xóa check
router.post('/api/upload', authenticate, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Kích thước tệp không thể vượt quá 50MB' });
            }
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }
        next();  
    });
}, fileController.uploadFile);

router.get('/api/public-files', authorizeAdmin, async (req, res) => {
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
router.get('/search', fileController.searchFile);

module.exports = router;
