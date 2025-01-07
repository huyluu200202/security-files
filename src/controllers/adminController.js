const Permission = require('../models/permissionModel');
const User = require('../models/userModel');
const File = require('../models/fileModel');

exports.assignPermission = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: Action not allowed for non-admin users' });
        }

        const { userId, fileId, can_view, can_download, can_edit } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const [permission, created] = await Permission.findOrCreate({
            where: { user_id: userId, file_id: fileId },
            defaults: { can_view, can_download, can_edit }
        });

        if (!created) {
            permission.can_view = can_view;
            permission.can_download = can_download;
            permission.can_edit = can_edit;
            await permission.save();
        }

        res.status(200).json({
            message: created ? 'Permission assigned successfully' : 'Permission updated successfully',
            permission
        });
    } catch (error) {
        console.error('Error assigning permission:', error);
        res.status(500).json({ error: 'Failed to assign permission' });
    }
};

exports.getPermissions = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: Access restricted to admin users' });
        }

        const permissions = await Permission.findAll({
            include: [User, File]
        });

        res.status(200).json(permissions);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Failed to retrieve permissions' });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: Deletion not allowed for non-admin users' });
        }

        const { permissionId } = req.params;

        const permission = await Permission.findOne({ where: { id: permissionId } });
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        await permission.destroy();
        res.status(200).json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({ error: 'Failed to delete permission' });
    }
};

exports.getUserPermissions = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Permission denied: Access restricted to admin users' });
        }

        const { userId } = req.params;

        const permissions = await Permission.findAll({
            where: { user_id: userId },
            include: [File] 
        });

        if (permissions.length === 0) {
            return res.status(404).json({ message: 'No permissions found for this user' });
        }

        res.status(200).json(permissions);
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ error: 'Failed to retrieve user permissions' });
    }
};
