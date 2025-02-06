const express = require('express');
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const File = require('../models/fileModel');

const router = express.Router();

// Cấu hình lưu trữ file tạm
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // Chỉ định thư mục lưu trữ
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`; // Tên file unique
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Tên file kèm phần mở rộng
    },
});

// Cấu hình multer để giới hạn kích thước file (50MB)
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn file 50MB
}).single('file');

// Định tuyến và middleware xử lý upload
router.get('/upload', (req, res) => {
    res.render('upload');
});

// Đường dẫn API để upload file, kiểm tra xác thực và xử lý file
router.post('/api/upload', authenticate, (req, res, next) => {
    // Nếu có lỗi về kích thước file, multer sẽ trả về lỗi tự động
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File size exceeds the 50MB limit.' });
            }
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }
        next();  // Nếu không có lỗi, chuyển sang controller xử lý
    });
}, fileController.uploadFile);

// Các API khác...
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
router.get('/search', fileController.searchFile);

module.exports = router;
