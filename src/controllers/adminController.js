const Permission = require('../models/permissionModel');
const User = require('../models/userModel');
const File = require('../models/fileModel');
exports.assignPermission = async (req, res) => {
    try {
        const { userId, fileId, can_view, can_download, can_upload } = req.body;

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
            defaults: { can_view, can_download, can_upload }
        });

        if (!created) {
            permission.can_view = can_view;
            permission.can_download = can_download;
            permission.can_upload = can_upload;
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
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.getPermissions = async (req, res) => {
    try {
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
