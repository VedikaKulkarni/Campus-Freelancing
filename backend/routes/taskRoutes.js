const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Client = require('../models/Client');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error fetching tasks', error: error.message });
  }
});

// Get tasks posted by a specific client
router.get('/client/:clientId', async (req, res) => {
  try {
    const tasks = await Task.find({ clientId: req.params.clientId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    res.status(500).json({ message: 'Server error fetching client tasks', error: error.message });
  }
});

// Get single task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Server error fetching task details', error: error.message });
  }
});

// Post a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, category, budget, deadline, skillsRequired, clientId } = req.body;
    const mongoose = require('mongoose');

    let clientName = "Nova Technologies LLC";
    let validClientId = new mongoose.Types.ObjectId();

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      const client = await Client.findById(clientId);
      if (client) {
        clientName = client.name;
        validClientId = client._id;
      }
    }

    const task = new Task({
      title,
      description,
      category,
      budget: parseFloat(budget) || 100,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? skillsRequired.split(',').map(s => s.trim()).filter(Boolean) : []),
      clientId: validClientId,
      clientName: clientName,
      status: 'Open',
      applicants: 0
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task', error: error.message });
  }
});

module.exports = router;
