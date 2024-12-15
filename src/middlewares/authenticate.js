const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from 'Bearer token'
    if (!token) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const decoded = jwt.verify(token, '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb'); // Replace with your secret key
        req.user = decoded; // Set user data to req.user
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

module.exports = authenticate;
