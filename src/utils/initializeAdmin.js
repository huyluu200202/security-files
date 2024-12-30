const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); 

const initializeAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('123456a@A', 10); 
            
            // Tạo tài khoản admin
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

        const userExists = await User.findOne({ where: { username: 'giangvien1' } });
        if (!userExists) {
            const hashedUserPassword = await bcrypt.hash('123456', 10);

            await User.create({
                id: uuidv4(),
                fullname: 'Giang Vien 1',
                username: 'giangvien1',
                email: 'giangvien1@gmail.com',
                password: hashedUserPassword,
                role: 'giangvien',
            });
            // console.log('Giang Vien 1 account created successfully!');
        } else {
            // console.log('Giang Vien 1 account already exists.');
        }
    } catch (error) {
        console.error('Error creating accounts:', error);
    }
};

module.exports = initializeAdminAccount;
