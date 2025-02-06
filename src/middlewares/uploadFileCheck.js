const moment = require('moment');
const User = require('../models/userModel');

const uploadFileCheck = (req, res, next) => {
    const userId = req.user.userId;
    
    User.findOne({ where: { id: userId } }).then(user => {
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const lastUploadAt = user.lastUploadAt;
        const currentTime = moment();

        if (lastUploadAt && moment(lastUploadAt).add(30, 'seconds').isAfter(currentTime)) {
            const waitTime = moment(lastUploadAt).add(30, 'seconds').diff(currentTime, 'seconds');
            return res.status(429).json({ 
                message: `Please wait ${waitTime} seconds before uploading another file.` 
            });
        }
        
        next(); 
    }).catch(error => {
        console.error('Upload validation failed:', error);
        res.status(500).json({ error: 'Upload validation failed' });
    });
};

module.exports = uploadFileCheck;
