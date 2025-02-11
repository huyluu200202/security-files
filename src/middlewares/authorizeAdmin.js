const jwt = require('jsonwebtoken');

const authorizeAdmin = (req, res, next) => {
    const token = req.cookies.token || req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb'); 
        req.user = decoded;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authorizeAdmin;
