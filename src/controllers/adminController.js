const Permission = require('../models/permissionModel');
const User = require('../models/userModel');
const File = require('../models/fileModel');

exports.assignViewDownloadPermission = async (req, res) => {
    try {
        const { userId, fileId, can_view, can_download } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const permission = await Permission.findOne({
            where: { user_id: userId, file_id: fileId }
        });

        if (permission) {
            permission.can_view = can_view;
            permission.can_download = can_download;

            if (!can_view && !can_download) {
                await permission.destroy();
            } else {
                await permission.save();
            }
        } else {
            if (can_view || can_download) {
                await Permission.create({ user_id: userId, file_id: fileId, can_view, can_download });
            }
        }

        res.status(200).json({
            message: permission ? 'Permissions updated successfully' : 'Permissions assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning view/download permissions:', error);
        res.status(500).json({ error: 'Failed to assign view/download permissions' });
    }
};
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Permission.destroy({ where: { user_id: userId } });
        await user.destroy();

        res.status(200).json({ message: 'User and associated permissions deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

exports.checkViewDownloadPermission = async (req, res) => {
    const { role, filePath } = req.query;

    try {
        const file = await File.findOne({ where: { fileName: filePath } });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (role === 'admin') {
            return res.json({ can_view: true, can_download: true });
        }

        const permission = await Permission.findOne({
            where: { user_id: role, file_id: file.id }
        });

        if (!permission) {
            return res.json({ can_view: false, can_download: false });
        }

        res.json({
            can_view: permission.can_view,
            can_download: permission.can_download
        });
    } catch (error) {
        console.error('Error checking permissions:', error);
        res.status(500).json({ error: 'Failed to check permissions' });
    }
};