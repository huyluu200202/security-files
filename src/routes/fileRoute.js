const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');

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

router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
          console.error('File not found:', filePath);
          return res.status(404).send('File not found');
      }
      res.download(filePath);
  });
});

router.post('/api/upload', authenticate, upload.single('file'), fileController.uploadFile);

module.exports = router;