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

        if (blockedIp) {
            return res.status(403).json({ message: 'This IP has been permanently blocked.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await handleFailedLogin(ipAddress);
            return res.status(401).json({ message: 'Invalid password' });
        }

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
            ipRecord.failed_attempts += 1;
            ipRecord.last_attempt_at = new Date();

            if (ipRecord.failed_attempts >= 5) {
                ipRecord.is_blocked = true;
                ipRecord.blocked_at = new Date();
                console.log(`Blocked IP: ${ipAddress} due to multiple failed login attempts.`);
            }

            await ipRecord.save();
        } else {
            await BlackListIp.create({
                id: uuidv4(),
                ip_address: ipAddress,
                failed_attempts: 1,
                last_attempt_at: new Date()
            });
        }
    } catch (error) {
        console.error('Error handling failed login attempt:', error);
    }
}
