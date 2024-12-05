const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); 

const initializeAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('123456a@A', 10); 
            await User.create({
                id: uuidv4(),
                fullname: 'admin',          
                username: 'admin',    
                email: 'admin@gmail.com', 
                password: hashedPassword,  
                role: 'admin',       
            });
            console.log('Default admin account created successfully!');
        } else {
            console.log('Admin account already exists.');
        }
    } catch (error) {
        console.error('Error creating admin account:', error);
    }
};

module.exports = initializeAdminAccount;

