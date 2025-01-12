const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'Username does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, fullname: user.fullname, role: user.role },
            '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',  
            maxAge: 3600000,  
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { username: user.username, fullname: user.fullname, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during login', error: error.message });
    }
};