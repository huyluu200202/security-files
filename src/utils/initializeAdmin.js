const User = require('../models/userModel');
// const File = require('../models/fileModel');
const Permission = require('../models/permissionModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
// const path = require('path');
// const fs = require('fs');

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

        const adminUserId = adminUser.id; 

        // const defaultFileExists = await File.findOne({ where: { fileName: 'default_file.txt' } });
        // let defaultFile;

        // if (!defaultFileExists) {
        //     const defaultFileName = 'default_file.txt';
        //     const defaultFilePath = path.join(__dirname, '../uploads', defaultFileName);

        //     if (!fs.existsSync(defaultFilePath)) {
        //         fs.writeFileSync(defaultFilePath, 'This is a default file.');
        //     }

        //     defaultFile = await File.create({
        //         id: uuidv4(),
        //         fileName: defaultFileName,
        //         filePath: defaultFilePath,
        //         friendlyFileType: 'Text File',
        //         formattedFileSize: '0 KB',
        //         user_id: adminUserId, 
        //         uploadedBy: 'admin'
        //     });

        //     console.log('Default file created!');
        // } else {
        //     defaultFile = defaultFileExists;
        // }

        const teacherExists = await User.findOne({ where: { username: 'giangvien1' } });
        if (!teacherExists) {
            const hashedTeacherPassword = await bcrypt.hash('123456', 10);

            const teacherUser = await User.create({
                id: uuidv4(),
                fullname: 'Giang Vien 1',
                username: 'giangvien1',
                email: 'giangvien1@gmail.com',
                password: hashedTeacherPassword,
                role: 'giangvien',
            });

            // await Permission.create({
            //     user_id: teacherUser.id,
            //     // file_id: defaultFile.id,
            //     can_view: false,
            //     can_download: false,
            //     can_edit: false,
            // });

            console.log('Teacher account created!');
        }

        const studentExists = await User.findOne({ where: { username: 'sinhvien1' } });
        if (!studentExists) {
            const hashedStudentPassword = await bcrypt.hash('123456', 10);

            const studentUser = await User.create({
                id: uuidv4(),
                fullname: 'Sinh Vien 1',
                username: 'sinhvien1',
                email: 'sinhvien1@gmail.com',
                password: hashedStudentPassword,
                role: 'sinhvien',
            });

            // await Permission.create({
            //     user_id: studentUser.id,
            //     // file_id: defaultFile.id,
            //     can_view: false,
            //     can_download: false,
            //     can_edit: false,
            // });

            console.log('Student account created!');
        }

    } catch (error) {
        console.error(error);
    }
};

module.exports = initializeAdminAccount;
