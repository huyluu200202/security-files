// const jwt = require('jsonwebtoken');
// const Permission = require('../models/permissionModel');

// const checkPermissions = async (req, res, next) => {
//     const token = req.cookies.token;

//     if (!token) {
//         return res.status(401).json({ message: 'Unauthorized: No token provided' });
//     }

//     try {
//         const decoded = jwt.verify(token, '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb');
//         const userId = decoded.userId;

//         // Extract fileId from the request, assuming it's passed in the query or body
//         const { fileId } = req.body || req.query;

//         if (!fileId) {
//             return res.status(400).json({ message: 'File ID is required' });
//         }

//         // Check permissions in the database
//         const permission = await Permission.findOne({
//             where: { user_id: userId, file_id: fileId },
//         });

//         if (!permission) {
//             return res.status(403).json({ message: 'Permission denied' });
//         }

//         // Attach permissions to the request for further use
//         req.permissions = permission;
//         next();
//     } catch (error) {
//         console.error(error);
//         return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error.message });
//     }
// };

// module.exports = checkPermissions;

const Permission = require('../models/permissionModel');

const checkPermissions = async (req, res, next) => {
    const { role, id: userId } = req.user; 
    const { fileId } = req.params; 

    try {
        if (role === 'admin') {
            return next();
        }

        const permission = await Permission.findOne({
            where: { user_id: userId, file_id: fileId },
        });

        if (!permission || (!permission.can_view && !permission.can_download)) {
            return res.status(403).json({ message: 'You do not have permission to access this file.' });
        }

        req.permission = permission;
        next();
    } catch (error) {
        console.error('Error checking permissions:', error.message);
        res.status(500).json({ error: 'Failed to check permissions' });
    }
};

module.exports = checkPermissions;
