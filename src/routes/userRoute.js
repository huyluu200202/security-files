const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const File = require('../models/fileModel');
// const authenticate = require('../middlewares/authenticate');

// Register and Login Routes
router.post('/api/register', userController.register);
router.post('/api/login', userController.login);

// Home route for viewing files
// router.get('/', authenticate, async (req, res) => {  // Using 'authenticate' middleware here
//     try {
//         const files = await File.findAll();
//         res.render('home', { 
//             files, 
//             authenticate: true, // Indicating the user is authenticated
//             user: req.user, // You can pass user info from the JWT to the view
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'An error occurred', error: error.message });
//     }
// });

router.get('/', async (req, res) => {  // Using 'authenticate' middleware here
    try {
        const files = await File.findAll();
        res.render('home', { 
            files, 
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

// Login and Register pages
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

module.exports = router;
