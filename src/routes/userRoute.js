const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/api/register', userController.register);  
router.post('/api/login', userController.login);       


router.get('/', (req, res) => {
  res.render('home');  
});

router.get('/login', (req, res) => {
  res.render('login');  
});

router.get('/register', (req, res) => {
  res.render('register');  
});

module.exports = router;
