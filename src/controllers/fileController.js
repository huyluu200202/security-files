const File = require('../models/fileModel');
const User = require('../models/userModel');
const AuditLog = require('../models/auditLogModel');
const Permission = require('../models/permissionModel');
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
    'audio/mpeg': 'MP3 Audio',
    'video/mp4': 'MP4 Video'
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

const hasPermissionToView = async (userId, fileId) => {
    const permission = await Permission.findOne({
        where: { user_id: userId, file_id: fileId },
    });
    return permission && permission.can_view;
};

const hasPermissionToDownload = async (userId, fileId) => {
    const permission = await Permission.findOne({
        where: { user_id: userId, file_id: fileId },
    });
    return permission && permission.can_download;
};

// exports.getFiles = async () => {
//     try {
//         const files = await File.findAll();
//         const filesWithFriendlyTypes = files.map(file => ({
//             ...file.dataValues,
//             friendlyFileType: getFriendlyFileType(file.friendlyFileType),
//             fileSize: file.formattedFileSize,
//         }));

//         return filesWithFriendlyTypes;
//     } catch (error) {
//         console.error('Error fetching files:', error);
//         throw new Error('Failed to retrieve files');
//     }
// };

// exports.getFiles = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const userRole = req.user.role;

//         // Fetch all files from the database
//         const files = await File.findAll();

//         // If the user is an admin, they should have access to all files
//         if (userRole === 'admin') {
//             const filesWithFriendlyTypes = files.map(file => ({
//                 ...file.dataValues,
//                 friendlyFileType: getFriendlyFileType(file.friendlyFileType),
//                 fileSize: file.formattedFileSize,
//             }));
//             return res.status(200).json(filesWithFriendlyTypes);
//         }

//         // If the user is not an admin, check for permissions
//         const filesWithPermissions = [];

//         for (const file of files) {
//             // Check if the user has permission to access the file
//             const permission = await Permission.findOne({
//                 where: { user_id: userId, file_id: file.id }
//             });

//             // If the user has permission, add the file to the response
//             if (permission && permission.can_view) {
//                 filesWithPermissions.push({
//                     ...file.dataValues,
//                     friendlyFileType: getFriendlyFileType(file.friendlyFileType),
//                     fileSize: file.formattedFileSize,
//                 });
//             }
//         }

//         // Return only files the user has permission to view
//         res.status(200).json(filesWithPermissions);
//     } catch (error) {
//         console.error('Error fetching files:', error);
//         res.status(500).send('Failed to retrieve files');
//     }
// };

exports.getFiles = async (req, res) => {
    try {
        const { userId, role } = req.user;

        const files = await File.findAll();

        if (role === 'admin') {
            return res.status(200).json(files.map(file => ({
                ...file.dataValues,
                friendlyFileType: getFriendlyFileType(file.friendlyFileType),
                fileSize: file.formattedFileSize,
            })));
        }

        const filePermissions = await Permission.findAll({
            where: { user_id: userId },
            include: [{ model: File }]
        });

        const filesWithPermissions = filePermissions.filter(permission => permission.can_view).map(permission => ({
            ...permission.File.dataValues,
            friendlyFileType: getFriendlyFileType(permission.File.friendlyFileType),
            fileSize: permission.File.formattedFileSize,
        }));

        res.status(200).json(filesWithPermissions);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Failed to retrieve files');
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
        const userRole = req.user.role;

        if (userRole === 'sinhvien') {
            return res.status(403).json({ message: 'Permission denied: Upload not allowed for students' });
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const { originalname, mimetype, size } = req.file;
        const fileName = Buffer.from(originalname, 'latin1').toString('utf8');

        const friendlyFileType = getFriendlyFileType(mimetype);
        const formattedFileSize = convertFileSize(size);

        const filePath = path.join(__dirname, '../uploads', fileName);

        fs.renameSync(req.file.path, filePath);

        const newFile = await File.create({
            fileName,
            filePath,
            friendlyFileType,
            formattedFileSize,
            user_id: userId,
            uploadedBy: user.username,
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

exports.viewFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Check if file exists
        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Admin bypass: Admins can always view files
        if (userRole === 'admin') {
            return sendFile(file);
        }

        // Check if the user has permission to view the file
        const canView = await hasPermissionToView(userId, fileId);
        if (!canView) {
            return res.status(403).json({ message: 'Permission denied: You do not have view permissions.' });
        }

        return sendFile(file);

        async function sendFile(file) {
            // Log the view action
            await AuditLog.create({
                user_id: userId,
                file_id: file.id,
                action: 'view',
                description: `File ${file.fileName} viewed.`,
            });

            // Return the file
            const filePath = path.join(__dirname, '../uploads', file.fileName);
            res.sendFile(filePath);
        }

    } catch (error) {
        console.error('Error in viewFile method:', error);
        res.status(500).json({ error: 'Failed to view file' });
    }
};

exports.downloadFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const fileName = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', fileName);

        const file = await File.findOne({ where: { fileName } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Admin bypass: Admins can always download files
        if (userRole === 'admin') {
            return downloadFileAction(file);
        }

        // Check if the user has permission to download the file
        const canDownload = await hasPermissionToDownload(userId, file.id);
        if (!canDownload) {
            return res.status(403).json({ message: 'Permission denied: You do not have download permissions.' });
        }

        return downloadFileAction(file);

        async function downloadFileAction(file) {
            // Log the download action
            await AuditLog.create({
                user_id: userId,
                file_id: file.id,
                action: 'download',
                description: `File ${fileName} downloaded.`,
            });

            res.download(filePath, fileName);
        }

    } catch (error) {
        console.error('Error in downloadFile method:', error);
        res.status(500).json({ error: 'File download failed' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fileId } = req.params;

        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);

        await fs.promises.unlink(filePath);

        await AuditLog.create({
            user_id: userId,
            file_id: file.id,
            action: 'delete',
            description: `File ${file.fileName} deleted.`,
        });

        await file.destroy();

        res.status(200).json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('File deletion failed:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
};