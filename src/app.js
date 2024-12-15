const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoute');
const fileRoutes = require('./routes/fileRoute');
const path = require('path');
// const fs = require('fs');
const initializeAdminAccount = require('./utils/initializeAdmin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initializeAdminAccount();

// app.get('/uploads/:filename', (req, res) => {
//   const filePath = path.join(__dirname, 'uploads', req.params.filename);

//   fs.access(filePath, fs.constants.F_OK, (err) => {
//       if (err) {
//           console.error('File not found:', filePath);
//           return res.status(404).send('File not found');
//       }
//       res.download(filePath);
//   });
// });

app.use('/', fileRoutes);
app.use('/', userRoutes);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
