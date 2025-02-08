const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const initializeAdminAccount = async () => {
    try {
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        let adminUser;

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('123456a@A', 10);

            adminUser = await User.create({
                id: uuidv4(),
                fullname: 'admin',
                username: 'admin',
                email: 'admin@gmail.com',
                password: hashedPassword,
                role: 'admin',
            });

            console.log('Admin account created!');
        } else {
            adminUser = adminExists;
            console.log('Admin account already exists!');
        }

        const teacherExists = await User.findOne({ where: { username: 'giangvien2' } });
        if (!teacherExists) {
            const hashedTeacherPassword = await bcrypt.hash('123456', 10);

            await User.create({
                id: uuidv4(),
                fullname: 'Giang Vien 2',
                username: 'giangvien2',
                email: 'giangvien2@gmail.com',
                password: hashedTeacherPassword,
                role: 'giangvien',
            });
            console.log('Teacher account created!');
        }

        const studentExists = await User.findOne({ where: { username: 'sinhvien2' } });
        if (!studentExists) {
            const hashedStudentPassword = await bcrypt.hash('123456', 10);

            await User.create({
                id: uuidv4(),
                fullname: 'Sinh Vien 2',
                username: 'sinhvien2',
                email: 'sinhvien2@gmail.com',
                password: hashedStudentPassword,
                role: 'sinhvien',
            });

            console.log('Student account created!');
        }

    } catch (error) {
        console.error(error);
    }
};

module.exports = initializeAdminAccount;
