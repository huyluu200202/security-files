const File = require('../models/fileModel');

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const newFile = await File.create({
            fileName: req.file.filename,
            filePath: req.file.path,
        });
        res.status(200).json({ message: 'File uploaded successfully', file: newFile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading file' });
    }
};

exports.getFiles = async (req, res) => {
    try {
        const files = await File.findAll();
        res.render('files', { files }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving files' });
    }
};
