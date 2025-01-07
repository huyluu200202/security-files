const User = require('../models/userModel');
const Permission = require('../models/permissionModel');
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

        const userExists = await User.findOne({ where: { username: 'giangvien1' } });
        if (!userExists) {
            const hashedUserPassword = await bcrypt.hash('123456', 10);
        
            const newUser = await User.create({
                id: uuidv4(),
                fullname: 'Giang Vien 1',
                username: 'giangvien1',
                email: 'giangvien1@gmail.com',
                password: hashedUserPassword,
                role: 'giangvien',
            });
        
            // await Permission.create({
            //     user_id: newUser.id,
            //     file_id: null,  
            //     can_view: false,
            //     can_download: false,
            //     can_edit: false,
            //     can_upload: false,
            // });
        } 
        
        const studentExists = await User.findOne({ where: { username: 'sinhvien1' } });
        if (!studentExists) {
            const hashedUserPassword = await bcrypt.hash('123456', 10);
        
            const newStudent = await User.create({
                id: uuidv4(),
                fullname: 'Sinh Vien 1',
                username: 'sinhvien1',
                email: 'sinhvien1@gmail.com',
                password: hashedUserPassword,
                role: 'sinhvien',
            });
        
            // await Permission.create({
            //     user_id: newStudent.id,
            //     file_id: null,  
            //     can_view: false,
            //     can_download: false,
            //     can_edit: false,
            //     can_upload: false,  
            // });
        } 
    } catch (error) {
        console.error('Error creating accounts:', error);
    }
};

module.exports = initializeAdminAccount;
