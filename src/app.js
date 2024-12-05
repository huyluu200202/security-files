const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoute');
const fileRoutes = require('./routes/fileRoute');
const path = require('path');
const initializeAdminAccount = require('./utils/initializeAdmin'); 

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initializeAdminAccount();

app.use('/', fileRoutes);  
app.use('/', userRoutes);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
