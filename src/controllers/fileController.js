const File = require('../models/fileModel');

// Hàm uploadFile
exports.uploadFile = async (req, res) => {
    try {
        const { originalname, filename, path: filePath, mimetype, size } = req.file;

        const newFile = await File.create({
            fileName: originalname,
            filePath,
            fileType: mimetype,
            fileSize: size,
        });

        res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload file', error: error.message });
    }
};

exports.getFiles = async (req, res) => {
    try {
        const files = await File.findAll(); // Gọi findAll
        console.log('Files fetched from DB:', files); // Log dữ liệu trả về
        res.status(200).json({ files });
    } catch (error) {
        console.error('Error fetching files:', error); // Log lỗi nếu có
        res.status(500).json({ message: 'Failed to retrieve files', error: error.message });
    }
};


