// // middlewares/authenticate.js
// const jwt = require('jsonwebtoken');
// const secretKey = '06ffc9c35d1a596406dbc2492b4d79db1976597a91885472def9060e6fa581eb';  // Use a secure key for signing tokens

// module.exports = (req, res, next) => {
//     // Get the token from the Authorization header (Bearer <token>)
//     const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

//     if (!token) {
//         // If there is no token, return an error or redirect to login
//         return res.redirect('/login');
//     }

//     try {
//         // Verify the token using the secret key
//         const decoded = jwt.verify(token, secretKey);

//         // If token is valid, save the decoded user data to the request object
//         req.user = decoded;  // You can access user data using req.user in the route
//         next();  // Continue with the request
//     } catch (error) {
//         // If token verification fails, redirect to login or send an error
//         return res.redirect('/login');
//     }
// };
