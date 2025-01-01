const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const File = require('../models/fileModel'); // Ensure File model is required

const router = express.Router();

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // Path for file storage
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

// Route to render upload page (for uploading files)
router.get('/upload', (req, res) => {
    res.render('upload');
});

// Route to download file
router.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename); // Correct path for file

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found:', filePath);
            return res.status(404).send('File not found');
        }
        res.download(filePath); // Initiate download
    });
});

router.get('/uploads/delete/:fileName', async (req, res) => {
    const { fileName } = req.params;

    try {
        // Tìm file trong cơ sở dữ liệu theo fileName
        const file = await File.findOne({ where: { fileName: fileName } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Xác định đường dẫn file trong hệ thống
        const filePath = path.join(__dirname, '../uploads', file.fileName);

        // Xóa file khỏi hệ thống tệp
        await fs.promises.unlink(filePath);

        // Xóa bản ghi file trong cơ sở dữ liệu
        await file.destroy();
        res.redirect('/');
    } catch (error) {
        console.error('File deletion failed:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
});


// Route to handle file upload (via POST request)
router.post('/api/upload', authenticate, upload.single('file'), fileController.uploadFile);

module.exports = router;
