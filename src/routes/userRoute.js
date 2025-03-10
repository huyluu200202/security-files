const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const File = require('../models/fileModel');

router.post('/api/login', userController.login);

router.get('/', async (req, res) => {
    try {
        let token = req.cookies.token || null;

        if (!token) {
            return res.redirect('/login');
        }

        const files = await File.findAll();
        const publicFiles = await File.findAll({ where: { isPublic: true } });
        
        res.render('home', {
            files,
            token,
            publicFiles 
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

router.get('/login', (req, res) => {
    if (req.cookies.token) {
        return res.redirect('/');
    }
    res.render('login');
});

router.get('/logout', (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.redirect('/login');
});

module.exports = router;
