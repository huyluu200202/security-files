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
const { Sequelize } = require('sequelize');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const unzipper = require('unzipper');

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

// Hàm kiểm tra tệp ZIP có chứa các tệp nguy hiểm hay không
async function checkZipFile(tempPath) {
    const directory = await unzipper.Open.file(tempPath);
    for (const file of directory.files) {
        const fileName = file.path;
        const fileExt = path.extname(fileName).toLowerCase();
        
        // Kiểm tra các tệp nguy hiểm bên trong ZIP
        if (['.exe', '.msi', '.bat', '.sh', '.php', '.asp'].includes(fileExt)) {
            throw new Error(`Không hỗ trợ các tệp bên trong tệp Zip: ${fileName}`);
        }
    }
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
        const userRole = req.user.role;

        if (userRole === 'sinhvien') {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này.' });
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ message: 'Người dùng không tồn tại' });
        }

        // Kiểm tra thời gian giữa các lần upload (30 giây)
        const lastUploadAt = user.lastUploadAt;
        const currentTime = moment();
        if (lastUploadAt && moment(lastUploadAt).add(30, 'seconds').isAfter(currentTime)) {
            return res.status(429).json({
                message: `Vui lòng chờ ${moment(lastUploadAt).add(30, 'seconds').diff(currentTime, 'seconds')} giây để tiếp tục thực hiện thao tác.`
            });
        }

        // Chặn các file dạng audio và video, img và tệp nguy hiểm
        const disallowedMimeTypes = [
            'audio/mpeg',  // MP3 Audio
            'audio/wav',   // WAV Audio
            'audio/ogg',   // OGG Audio
            'video/mp4',   // MP4 Video
            'video/avi',   // AVI Video
            'video/mkv',   // MKV Video
            'video/webm',  // WebM Video
            'audio/x-wav', // Wav Audio
            'audio/x-m4a',   // M4A Audio
            'audio/aac',   // AAC Audio
            'image/gif',   // GIF Image
        
            // Các loại tệp nguy hiểm
            'application/x-msdownload', // EXE (Windows Executable)
            'application/x-msi',        // MSI Installer
            'application/x-bat',        // BAT script
            'application/x-sh',         // Shell script (UNIX)
            'application/x-cmd',        // CMD script
            'application/x-php',        // PHP script
            'application/x-asp',        // ASP script
            'application/javascript',   // JavaScript
            'text/javascript',          // JavaScript
            'application/x-vbscript',   // VBScript
            'application/xml',          // XML
            'application/xhtml+xml',    // XHTML
            'text/html',                 // HTML
            'text/x-msdos-program',     // DOS Executables
            'application/x-perl',       // Perl scripts
            'application/x-ruby',       // Ruby scripts
            'application/x-tar',        // Tar archive, có thể chứa nhiều tệp độc hại
            'application/octet-stream',  // Generic binary data
            'application/x-rar-compressed', //	Tệp rar
            'application/x-compressed'	
        ];
        
        const { originalname, mimetype, size, path: tempPath } = req.file;

        if (disallowedMimeTypes.includes(mimetype)) {
            fs.unlinkSync(tempPath);
            return res.status(400).json({ message: 'Không hỗ trợ với những định dạng này' });
        }

        // Kiểm tra nếu tệp là ZIP, cần kiểm tra các tệp bên trong
        if (mimetype === 'application/zip' || path.extname(originalname).toLowerCase() === '.zip') {
            try {
                await checkZipFile(tempPath); // Kiểm tra các tệp trong ZIP
                fs.unlinkSync(tempPath);
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }
        }

        const fileName = Buffer.from(originalname, 'latin1').toString('utf8');
        const friendlyFileType = getFriendlyFileType(mimetype);
        const formattedFileSize = convertFileSize(size);

        // Tính hash của file trước khi lưu
        const fileBuffer = fs.readFileSync(tempPath);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Kiểm tra xem file đã tồn tại hay chưa
        const existingFile = await File.findOne({ where: { fileHash } });
        if (existingFile) {
            // Xóa file tạm nếu phát hiện trùng lặp
            fs.unlinkSync(tempPath);
            return res.status(409).json({
                message: 'Tệp đã được đăng tải.',
                uploadedBy: existingFile.uploadedBy,
                uploadDate: existingFile.uploadedAt
            });
        }

        // Đổi tên file và lưu vào thư mục chính thức
        const filePath = path.join(__dirname, '../uploads', fileName);
        fs.renameSync(tempPath, filePath);

        // Mã hóa file trước khi lưu
        encryptFile(filePath);

        // Lưu thông tin file vào database
        const newFile = await File.create({
            fileName,
            filePath,
            fileHash, // Lưu hash vào CSDL
            friendlyFileType,
            formattedFileSize,
            user_id: userId,
            uploadedBy: user.username,
            uploadedAt: currentTime.toISOString(),
        });

        // Thêm vào bảng OCRLog để xử lý OCR
        const newOCRLog = await OCRLog.create({
            file_id: newFile.id,
            status: 'pending',
            result: null,
            error_message: null,
        });

        // Giải mã file tạm để OCR
        const tempFilePath = path.join(__dirname, '../uploads', `temp_${fileName}`);
        decryptFile(filePath, tempFilePath);

        if (mimetype === 'application/pdf') {
            await handlePdfOCR(tempFilePath, newFile.id, newOCRLog.id);
        } else if (mimetype.startsWith('image/')) {
            await handleImageOCR(tempFilePath, newFile.id, newOCRLog.id);
        }

        fs.unlinkSync(tempFilePath); // Xóa file tạm sau khi xử lý

        // Lưu lịch sử upload vào AuditLog
        await AuditLog.create({
            user_id: userId,
            file_id: newFile.id,
            action: 'upload',
            description: `File ${fileName} uploaded.`,
        });

        // Cập nhật thời gian upload cuối cùng của user
        user.lastUploadAt = currentTime.toISOString();
        await user.save();

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
        saveFilename: `pdf_page`,
        savePath: outputPath,
        format: 'png',
        width: 600,
        height: 800
    };

    const converter = pdf2pic.fromPath(filePath, options);
    
    try {
        // Chuyển toàn bộ PDF thành ảnh
        const pages = await converter.bulk(-1); // -1: Chuyển tất cả các trang
        console.log(`🔹 Đã chuyển ${pages.length} trang PDF thành ảnh.`);

        // Chạy OCR song song cho tất cả ảnh
        const ocrPromises = pages.map(async (page) => {
            const { data: { text } } = await Tesseract.recognize(page.path, 'eng');
            return text;
        });

        const ocrResults = await Promise.all(ocrPromises);
        const fullText = ocrResults.join('\n\n'); // Ghép text của từng trang

        // Cập nhật kết quả vào DB
        await OCRLog.update(
            { status: 'completed', result: fullText },
            { where: { id: ocrLogId } }
        );

        console.log('OCR hoàn tất:', fullText);
    } catch (error) {
        console.error('PDF chuyển đổi hoặc OCR thất bại:', error);
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
        const { fileName } = req.params;
        const file = await File.findOne({ where: { fileName } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);

        await fs.promises.unlink(filePath);
        await file.destroy();

        res.redirect('/');
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
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied.' });
        }

        const decoded = jwt.verify(token, '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb');
        const userId = decoded.userId;

        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const { fileName } = req.params;
        const file = await File.findOne({ where: { fileName } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '../uploads', file.fileName);
        const tempFilePath = path.join(__dirname, '../uploads', `temp_download_${file.fileName}`);

        // Giải mã file nếu cần
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

        // Lưu log tải file
        await AuditLog.create({
            user_id: userId,
            file_id: file.id,
            action: 'download',
            description: `File: ${file.fileName} downloaded`,
        });

    } catch (error) {
        console.error('File download failed:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'File download failed' });
        }
    }
};

exports.searchFile = async (req, res) => {
    try {
        const { searchQuery } = req.query;
        if (!searchQuery) {
            return res.send(`<script>alert('Search query is required'); window.location.href = '/';</script>`);
        }

        let whereClause = {};

        if (/\d+(KB|MB|GB)/.test(searchQuery)) {
            whereClause.formattedFileSize = { [Sequelize.Op.like]: `%${searchQuery}%` };
        } else if (['pdf', 'word', 'excel', 'image', 'ppt'].some(type => searchQuery.toLowerCase().includes(type))) {
            whereClause.friendlyFileType = { [Sequelize.Op.like]: `%${searchQuery}%` };
        } else {
            whereClause.fileName = { [Sequelize.Op.like]: `%${searchQuery}%` };
        }

        const files = await File.findAll({ where: whereClause });

        if (files.length === 0) {
            return res.send(`<script>alert('Không tìm thấy tệp nào phù hợp.'); window.location.href = '/';</script>`);
        }

        const filesWithFriendlyTypes = files.map(file => ({
            ...file.dataValues,
            friendlyFileType: getFriendlyFileType(file.friendlyFileType),
            fileSize: file.formattedFileSize,
        }));
        res.render('searchResults', { files: filesWithFriendlyTypes });

    } catch (error) {
        console.error('File search failed:', error);
        res.send(`<script>alert('Tìm kiếm không thành công, vui lòng thử lại sau.'); window.location.href = '/';</script>`);
    }
};

