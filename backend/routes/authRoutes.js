const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes for registration
router.post('/register-student', authController.registerStudent);
router.post('/register-client', authController.registerClient);

// Route for login
router.post('/login', authController.login);

// Routes for client profile
router.get('/client/:id', authController.getClientProfile);
router.put('/client/:id', authController.updateClientProfile);

// Routes for student profile
router.get('/student/:id', authController.getStudentProfile);
router.put('/student/:id', authController.updateStudentProfile);
router.get('/students', authController.getAllStudents);

module.exports = router;
