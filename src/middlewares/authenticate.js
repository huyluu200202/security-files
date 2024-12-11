const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  

    console.log('Authorization header:', req.headers['authorization']);  

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authentication failed' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);  
        req.user = decoded; 
        next(); 
    } catch (error) {
        console.error('Token verification failed:', error); 
        return res.status(401).json({ message: 'Invalid token, authentication failed', error: error.message });
    }
};

module.exports = authenticate;
