const Permission = require('../models/permissionModel');
const checkPermissions = (action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.userId; 
            const userRole = req.user.role;

            if (userRole === 'admin') {
                return next();
            }

            const fileId = req.params.fileId || req.body.fileId;

            if (!fileId) {
                return res.status(400).json({ message: 'File ID is required for this action.' });
            }

            const permission = await Permission.findOne({
                where: { user_id: userId, file_id: fileId }
            });

            if (!permission || !permission[action]) {
                return res.status(403).json({ message: `Permission denied: You do not have ${action} permissions for this file.` });
            }

            next();
        } catch (error) {
            console.error('Permission check failed:', error);
            res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};

module.exports = checkPermissions;
