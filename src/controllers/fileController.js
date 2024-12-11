const File = require('../models/fileModel');

const mimeTypeMap = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
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

exports.uploadFile = async (req, res) => {
    try {
        const { originalname, mimetype, size } = req.file;
        const fileName = Buffer.from(originalname, 'latin1').toString('utf8');

        const friendlyFileType = getFriendlyFileType(mimetype);  
        const formattedFileSize = convertFileSize(size); 

        const newFile = await File.create({
            fileName,
            filePath: req.file.path,
            friendlyFileType,  
            formattedFileSize,  
        });

        res.status(201).json(newFile);
    } catch (error) {
        console.error('File upload failed:', error);  
        res.status(500).json({ error: 'File upload failed' });
    }
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
