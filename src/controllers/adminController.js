const User = require('../models/userModel');

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

// exports.getUserFile = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         const user = await User.findOne({ where: { id: userId } });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         await user.destroy();

//         res.status(200).json({ message: 'User deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting user:', error);
//         res.status(500).json({ error: 'Failed to delete user' });
//     }
// };
