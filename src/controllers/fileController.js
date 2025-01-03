const File = require('../models/fileModel');
const User = require('../models/userModel');
const AuditLog = require('../models/auditLogModel');
const fs = require('fs');
const path = require('path');

const mimeTypeMap = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'application/pdf': 'PDF Document',
    'application/gzip': 'GZip Document',
    'text/plain': 'Text File',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'application/zip': 'ZIP Archive',
};

const convertFileSize = (size) => {
    if (size < 1024) return size + ' bytes';
    else if (size < 1048576) return (size / 1024).toFixed(2) + ' KB';
    else if (size < 1073741824) return (size / 1048576).toFixed(2) + ' MB';
    else return (size / 1073741824).toFixed(2) + ' GB';
};

const getFriendlyFileType = (mimeType) => {
    return mimeTypeMap[mimeType] || mimeType;
};

exports.getFiles = async () => {
    try {
        const files = await File.findAll();
        const filesWithFriendlyTypes = files.map(file => ({
            ...file.dataValues,
            friendlyFileType: getFriendlyFileType(file.friendlyFileType),
            fileSize: file.formattedFileSize,
        }));

        return filesWithFriendlyTypes;
    } catch (error) {
        console.error('Error fetching files:', error);
        throw new Error('Failed to retrieve files');
    }
};
exports.getFilesName = async (req, res) => {
    try {
        const files = await File.findAll();
        const filesWithFriendlyTypes = files.map(file => ({
            ...file.dataValues,
            friendlyFileType: file.friendlyFileType,
            fileSize: file.formattedFileSize,
        }));

        res.render('home', { files: filesWithFriendlyTypes });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Internal Server Error');
    }
};
exports.uploadFile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const { originalname, mimetype, size } = req.file;
        const fileName = Buffer.from(originalname, 'latin1').toString('utf8'); 

        const friendlyFileType = getFriendlyFileType(mimetype);
        const formattedFileSize = convertFileSize(size);

        // Ensure the file is saved with the correct name
        const filePath = path.join(__dirname, '../uploads', fileName);
        
        // Save the file using its original name instead of userId
        fs.renameSync(req.file.path, filePath); // This will rename the file to the original name

        const newFile = await File.create({
            fileName,
            filePath, // Save the correct path in the database
            friendlyFileType,
            formattedFileSize,
            user_id: userId
        });

        await AuditLog.create({
            user_id: userId,
            file_id: newFile.id,
            action: 'upload',
            description: `File ${fileName} uploaded.`,
        });

        res.status(201).json(newFile);
    } catch (error) {
        console.error('File upload failed:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
};


exports.downloadFile = async (req, res) => {
    try {
        const userId = req.user.userId;  
        const fileName = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', fileName);

        console.log('Searching for file with name:', fileName);  

        const file = await File.findOne({ where: { fileName } });
        if (!file) {
            console.error('File not found in database:', fileName);  
            return res.status(404).json({ message: 'File not found' });
        }

        await AuditLog.create({
            user_id: userId,
            file_id: file.id,
            action: 'download',
            description: `File ${fileName} downloaded.`,
        });

        console.log('Download log created successfully');  

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error during file download:', err);  
                return res.status(500).send('Error downloading the file');
            }
            console.log('File download initiated successfully');  
        });
    } catch (error) {
        console.error('Error in downloadFile method:', error); 
        res.status(500).json({ error: 'File download failed' });
    }
};
exports.deleteFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fileId } = req.params; // Get fileId from params

        // Find the file in the database
        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Construct the correct file path using the file's name stored in the database
        const filePath = path.join(__dirname, '../uploads', file.fileName);

        // Delete the file from the file system
        await fs.promises.unlink(filePath);  // Use fs.promises for async/await

        // Log the file deletion action
        await AuditLog.create({
            user_id: userId,
            file_id: file.id,
            action: 'delete',
            description: `File ${file.fileName} deleted.`,
        });

        // Delete the file record from the database
        await file.destroy();

        // Return a success response
        res.status(200).json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('File deletion failed:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
};
