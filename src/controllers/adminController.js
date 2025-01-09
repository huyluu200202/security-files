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

        const [permission, created] = await Permission.findOrCreate({
            where: { user_id: userId, file_id: fileId },
            defaults: { can_view, can_download, can_upload: false }
        });

        if (!created) {
            permission.can_view = can_view;
            permission.can_download = can_download;
            await permission.save();
        }

        res.status(200).json({
            message: created
                ? 'View/Download permissions assigned successfully'
                : 'View/Download permissions updated successfully',
            permission,
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