const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { fullname, username, email, password, role } = req.body;

    try {
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already in use' });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            fullname,
            username,
            email,
            password: hashedPassword,
            role,
        });

        res.status(201).json({
            message: 'Register successful',
            user: { username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while registering user', error: error.message });
    }
};

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
            user: { username: user.username, fullname: user.fullname }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during login', error: error.message });
    }
};
