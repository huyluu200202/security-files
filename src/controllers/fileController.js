const File = require('../models/fileModel');
const User = require('../models/userModel');
const AuditLog = require('../models/auditLogModel');
const OCRLog = require('../models/ocrLogModel');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdf2pic = require("pdf2pic");
const crypto = require('crypto');
const mime = require('mime-types');
const mammoth = require('mammoth');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); 
const iv = crypto.randomBytes(16); 

function encryptFile(filePath) {
    const data = fs.readFileSync(filePath);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    fs.writeFileSync(filePath, encrypted);

    const keyDir = path.join(__dirname, '../uploads/key_path');
    const ivDir = path.join(__dirname, '../uploads/iv_path');

    if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true });
    }
    if (!fs.existsSync(ivDir)) {
        fs.mkdirSync(ivDir, { recursive: true });
    }

    const keyPath = path.join(keyDir, path.basename(filePath) + '.key');
    const ivPath = path.join(ivDir, path.basename(filePath) + '.iv');

    fs.writeFileSync(keyPath, key); 
    fs.writeFileSync(ivPath, iv);
}
function decryptFile(encryptedFilePath, outputFilePath) {
    const data = fs.readFileSync(encryptedFilePath);

    const keyDir = path.join(__dirname, '../uploads/key_path');
    const ivDir = path.join(__dirname, '../uploads/iv_path');

    const keyPath = path.join(keyDir, path.basename(encryptedFilePath) + '.key');
    const ivPath = path.join(ivDir, path.basename(encryptedFilePath) + '.iv');

    const key = fs.readFileSync(keyPath); 
    const iv = fs.readFileSync(ivPath); 
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    fs.writeFileSync(outputFilePath, decrypted);
}
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

        encryptFile(filePath); 

        const newFile = await File.create({
            fileName,
            filePath,
            friendlyFileType,
            formattedFileSize,
            user_id: userId,
            uploadedBy: user.username,
        });

        const newOCRLog = await OCRLog.create({
            file_id: newFile.id,
            status: 'pending',   
            result: null,       
            error_message: null, 
        });

        const tempFilePath = path.join(__dirname, '../uploads', `temp_${fileName}`);
        decryptFile(filePath, tempFilePath);

        if (mimetype === 'application/pdf') {
            await handlePdfOCR(tempFilePath, newFile.id, newOCRLog.id);
        } else if (mimetype.startsWith('image/')) {
            await handleImageOCR(tempFilePath, newFile.id, newOCRLog.id);
        }

        fs.unlinkSync(tempFilePath);

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
async function handlePdfOCR(filePath, fileId, ocrLogId) {
    const outputPath = path.join(__dirname, '../uploads/pdf_images');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const options = {
        density: 100,  
        saveFilename: 'pdf_to_image',
        savePath: outputPath,
        format: 'png',
        width: 600,
        height: 800
    };

    const converter = pdf2pic.fromPath(filePath, options);
    try {
        const resolve = await converter(1); 
        const { data: { text } } = await Tesseract.recognize(resolve.path, 'eng', { logger: (m) => console.log(m) });
        
        await OCRLog.update(
            { status: 'completed', result: text },
            { where: { id: ocrLogId } }
        );
        
        console.log('OCR Text:', text);
    } catch (error) {
        console.error('PDF conversion or OCR processing failed:', error);
        await OCRLog.update(
            { status: 'failed', error_message: error.message },
            { where: { id: ocrLogId } }
        );
    }
}
async function handleImageOCR(filePath, fileId, ocrLogId) {
    try {
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng', { logger: (m) => console.log(m) });
        
        await OCRLog.update(
            { status: 'completed', result: text },
            { where: { id: ocrLogId } }
        );
        
        console.log('OCR Text:', text);
    } catch (error) {
        console.error('Image OCR failed:', error);
        await OCRLog.update(
            { status: 'failed', error_message: error.message },
            { where: { id: ocrLogId } }
        );
    }
}
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
function convertDocxToHtml(fileContent) {
    return mammoth.convertToHtml({ buffer: fileContent }).then(result => result.value);
}
function convertPptxToHtml(fileContent) {
    return '<html><body><h1>PPTX content (placeholder)</h1></body></html>';
}
function convertExcelToHtml(fileContent) {
    const xlsx = require('xlsx');
    const workbook = xlsx.read(fileContent, { type: 'buffer' });
    return xlsx.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
}
exports.previewFile = async (req, res) => {
    try {
        const { fileName } = req.params;
        const file = await File.findOne({ where: { fileName } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);
        const tempFilePath = path.join(__dirname, '../uploads', `temp_preview_${file.fileName}`);

        decryptFile(filePath, tempFilePath);

        const mimeType = mime.lookup(file.fileName);
        
        const fileContent = fs.readFileSync(tempFilePath);

        fs.unlinkSync(tempFilePath);

        if (mimeType) {
            res.setHeader('Content-Type', mimeType);
        } else {
            res.setHeader('Content-Type', 'application/octet-stream'); 
        }

        const sanitizedFileName = encodeURIComponent(fileName);

        if (mimeType === 'application/pdf') {
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFileName}`);
            res.send(fileContent);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const htmlContent = convertDocxToHtml(fileContent);  
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFileName}.html`);
            res.send(htmlContent);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            const htmlContent = convertPptxToHtml(fileContent);  
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFileName}.html`);
            res.send(htmlContent);
        } else if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            const htmlContent = convertExcelToHtml(fileContent); 
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFileName}.html`);
            res.send(htmlContent);
        } else if (mimeType === 'text/plain') {
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFileName}`);
            res.send(fileContent.toString('utf-8'));
        } else {
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${sanitizedFileName}`);
            res.send(fileContent);
        }

    } catch (error) {
        console.error('File preview failed:', error);
        res.status(500).json({ error: 'File preview failed' });
    }
};
exports.downloadFile = async (req, res) => {
    try {
        const { fileName } = req.params;
        const file = await File.findOne({ where: { fileName } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);
        const tempFilePath = path.join(__dirname, '../uploads', `temp_download_${file.fileName}`);

        decryptFile(filePath, tempFilePath);

        const fileContent = fs.readFileSync(tempFilePath);

        const mimeType = mime.lookup(file.fileName);
        if (mimeType) {
            res.setHeader('Content-Type', mimeType);
        } else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }

        const sanitizedFileName = encodeURIComponent(fileName);

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${sanitizedFileName}`);

        res.send(fileContent);

        fs.unlinkSync(tempFilePath);

    } catch (error) {
        console.error('File download failed:', error);
        res.status(500).json({ error: 'File download failed' });
    }
};
