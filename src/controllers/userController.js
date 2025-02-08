const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const BlackListIp = require('../models/blackList_ip_Model');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'Username does not exist' });
        }

        const blockedIp = await BlackListIp.findOne({ where: { ip_address: ipAddress } });
        if (blockedIp && blockedIp.is_blocked) {
            return res.status(403).json({ message: 'This IP has been permanently blocked due to multiple failed login attempts.' });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Gọi hàm handleFailedLogin để kiểm tra và chặn IP nếu cần
            await handleFailedLogin(ipAddress);
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Tạo token và trả về kết quả đăng nhập thành công
        const token = jwt.sign(
            { userId: user.id, username: user.username, fullname: user.fullname, role: user.role },
            '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { username: user.username, fullname: user.fullname, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during login', error: error.message });
    }
};

async function handleFailedLogin(ipAddress) {
    try {
        let ipRecord = await BlackListIp.findOne({ where: { ip_address: ipAddress } });

        if (ipRecord) {
            // Tăng số lần thất bại lên 1
            ipRecord.failed_attempts += 1;
            ipRecord.last_attempt_at = new Date(); // Cập nhật thời gian lần đăng nhập thất bại gần nhất

            // Kiểm tra nếu số lần thất bại >= 5 và IP chưa bị block
            if (ipRecord.failed_attempts >= 5 && !ipRecord.is_blocked) {
                // Chặn IP và ghi lại thời gian block
                ipRecord.is_blocked = true;
                ipRecord.blocked_at = new Date();
                console.log(`Blocked IP: ${ipAddress} due to multiple failed login attempts.`);
            }

            // Lưu lại thông tin bản ghi IP
            await ipRecord.save();
        } else {
            // Nếu không có bản ghi IP, tạo mới bản ghi và tăng `failed_attempts` từ 1
            await BlackListIp.create({
                id: uuidv4(),
                ip_address: ipAddress,
                failed_attempts: 1,  // Đặt `failed_attempts` là 1 lần sai mật khẩu
                is_blocked: false,  // Ban đầu chưa bị block
                created_at: new Date(),
                last_attempt_at: new Date()
            });
        }
    } catch (error) {
        console.error('Error handling failed login attempt:', error);
    }
}
