const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Task = require('../models/Task');
const Student = require('../models/Student');

// Submit a new application
router.post('/', async (req, res) => {
  try {
    const { taskId, studentId, proposal, projectLinks } = req.body;
    const mongoose = require('mongoose');

    // 1. Validate and resolve Task
    let validTaskId = null;
    let validClientId = null;
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      const task = await Task.findById(taskId);
      if (task) {
        validTaskId = task._id;
        validClientId = task.clientId;
        // Increment applicants count
        task.applicants = (task.applicants || 0) + 1;
        await task.save();
      }
    }
    if (!validTaskId) {
      validTaskId = new mongoose.Types.ObjectId();
    }

    // 2. Validate and resolve Student
    let validStudentId = null;
    let studentName = "Alex Rivera";
    let studentCollege = "Stanford University";
    let studentYear = "4th Year";
    let studentEmail = "alex.rivera@stanford.edu";

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await Student.findById(studentId);
      if (student) {
        validStudentId = student._id;
        studentName = student.name;
        studentCollege = student.schoolOrCollegeName;
        studentYear = student.classOrYear;
        studentEmail = student.email;
      }
    }
    if (!validStudentId) {
      validStudentId = new mongoose.Types.ObjectId();
    }

    // 3. Prevent duplicate applications
    const existingApp = await Application.findOne({ taskId: validTaskId, studentId: validStudentId });
    if (existingApp) {
      return res.status(400).json({ message: 'You have already applied for this task!' });
    }

    const application = new Application({
      taskId: validTaskId,
      studentId: validStudentId,
      studentName,
      studentCollege,
      studentYear,
      studentEmail,
      proposal,
      projectLinks: projectLinks || [],
      status: 'Pending'
    });

    await application.save();

    // Emit real-time notification to client
    const io = req.app.get("io");
    if (io && validClientId) {
      io.to(validClientId.toString()).emit("realtime_update", {
        type: "new_application",
        data: { taskId: validTaskId, studentName }
      });
    }

    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Server error submitting application', error: error.message });
  }
});

// Fetch all applications submitted by a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.params.studentId })
      .populate('taskId')
      .sort({ appliedAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ message: 'Server error fetching applications', error: error.message });
  }
});

// Fetch all applications for a specific task
router.get('/task/:taskId', async (req, res) => {
  try {
    const applications = await Application.find({ taskId: req.params.taskId })
      .sort({ appliedAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching task applications:', error);
    res.status(500).json({ message: 'Server error fetching task applications', error: error.message });
  }
});

// Update application status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Interviewing', 'Hired', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // If student is hired, we could optionally update task status to "In Progress"
    if (status === 'Hired') {
      const task = await Task.findById(application.taskId);
      if (task && task.status === 'Open') {
        task.status = 'In Progress';
        await task.save();
      }
    }

    res.status(200).json({ message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error updating status', error: error.message });
  }
});

// Fetch all applications for tasks posted by a specific client
router.get('/client/:clientId', async (req, res) => {
  try {
    const tasks = await Task.find({ clientId: req.params.clientId });
    const taskIds = tasks.map(t => t._id);
    const applications = await Application.find({ taskId: { $in: taskIds } })
      .populate('taskId')
      .sort({ appliedAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching client applications:', error);
    res.status(500).json({ message: 'Server error fetching client applications', error: error.message });
  }
});

// Submit deliverables for a hired application
router.put('/:id/submit-deliverables', async (req, res) => {
  try {
    const { githubUrl, description, screenshots, videoUrl } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.deliverables = {
      githubUrl: githubUrl || '',
      description: description || '',
      screenshots: screenshots || [],
      videoUrl: videoUrl || '',
      submittedAt: new Date()
    };

    await application.save();

    // Emit real-time notification to client
    const io = req.app.get("io");
    if (io) {
      const task = await Task.findById(application.taskId);
      if (task && task.clientId) {
        io.to(task.clientId.toString()).emit("realtime_update", {
          type: "deliverables_submitted",
          data: { applicationId: application._id, taskTitle: task.title, studentName: application.studentName }
        });
      }
    }

    res.status(200).json({ message: 'Deliverables submitted successfully!', application });
  } catch (error) {
    console.error('Error submitting deliverables:', error);
    res.status(500).json({ message: 'Server error submitting deliverables', error: error.message });
  }
});

module.exports = router;
