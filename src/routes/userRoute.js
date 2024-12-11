const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const File = require('../models/fileModel'); 

router.post('/api/register', userController.register);
router.post('/api/login', userController.login);

router.get('/', async (req, res) => {
  try {
      const files = await File.findAll(); 
      res.render('home', { files }); 
  } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});

router.get('/', (req, res) => {
  res.render('home', { message: 'Welcome to the Home Page!' });
});


router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

module.exports = router;
