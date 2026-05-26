const Student = require('../models/Student');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');

// Register a new Student
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, mobileNumber, classOrYear, schoolOrCollegeName, enrollmentNumber, idCardImage, skills } = req.body;

    // Check if user exists
    let student = await Student.findOne({ email });
    if (student) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 100% Automated Verification Engine
    let verificationStatus = 'pending';
    let rejectionReason = '';

    const academicDomains = ['.edu', '.ac.in', '.edu.in', '.res.in'];
    const isAcademicEmail = academicDomains.some(domain => email.toLowerCase().endsWith(domain));

    if (isAcademicEmail) {
      verificationStatus = 'verified';
    } else if (idCardImage && idCardImage.startsWith('data:image')) {
      try {
        const Tesseract = require('tesseract.js');
        const base64Data = idCardImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const ocrResult = await Tesseract.recognize(imageBuffer, 'eng');
        const text = ocrResult.data.text || '';
        const normalizedText = text.toLowerCase();
        
        // 1. Name Match
        const normalizedName = name.toLowerCase();
        const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
        const nameMatched = normalizedText.includes(normalizedName) || 
                            (nameWords.length > 0 && nameWords.every(w => normalizedText.includes(w)));
                            
        // 2. College Match
        const normalizedCollege = schoolOrCollegeName.toLowerCase();
        const collegeWords = normalizedCollege.split(/\s+/).filter(w => w.length > 3 && w !== 'college' && w !== 'university');
        const collegeMatched = normalizedText.includes(normalizedCollege) || 
                               (collegeWords.length > 0 && collegeWords.some(w => normalizedText.includes(w)));
                               
        // 3. Enrollment Match
        const normalizedEnrollment = enrollmentNumber.toLowerCase();
        const enrollmentMatched = normalizedText.includes(normalizedEnrollment);
        
        // Evaluate OCR checks
        if (!nameMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Could not detect your name "${name}" on the uploaded student ID card image. Please ensure the image is clear and the name matches your profile.`;
        } else if (!collegeMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Could not detect your institution name "${schoolOrCollegeName}" on the ID card. Please ensure the card text is clear.`;
        } else if (!enrollmentMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Enrollment number "${enrollmentNumber}" was not found on the ID card. Please ensure the number matches exactly.`;
        } else {
          verificationStatus = 'verified';
        }
      } catch (ocrErr) {
        console.error('OCR Processing failed:', ocrErr);
        verificationStatus = 'rejected';
        rejectionReason = 'Auto-verification failed: Unable to process the uploaded ID card image. Please upload a clear image in PNG or JPG format.';
      }
    } else {
      verificationStatus = 'rejected';
      rejectionReason = 'Auto-verification failed: A valid student ID card image is required.';
    }

    student = new Student({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      classOrYear,
      schoolOrCollegeName,
      enrollmentNumber,
      idCardImage: idCardImage || 'default_path_or_url',
      verificationStatus,
      rejectionReason,
      skills
    });

    await student.save();
    res.status(201).json({ 
      message: 'Student registered successfully', 
      studentId: student._id,
      verificationStatus,
      rejectionReason 
    });
  } catch (error) {
    console.error('Error in registerStudent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register a new Client
exports.registerClient = async (req, res) => {
  try {
    const { name, email, password, mobileNumber, companyName, industryOrWorkType } = req.body;

    // Check if user exists
    let client = await Client.findOne({ email });
    if (client) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    client = new Client({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      companyName,
      industryOrWorkType
    });

    await client.save();
    res.status(201).json({ message: 'Client registered successfully', clientId: client._id });
  } catch (error) {
    console.error('Error in registerClient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Common Login for Both
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;
    if (role === 'student') {
      user = await Student.findOne({ email });
    } else {
      user = await Client.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // For a real app, generate a JWT token here
    res.status(200).json({ message: 'Logged in successfully', userRole: role, userId: user._id });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Client Profile
exports.getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    console.error('Error in getClientProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Client Profile
exports.updateClientProfile = async (req, res) => {
  try {
    const { name, email, mobileNumber, companyName, industryOrWorkType } = req.body;
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.name = name || client.name;
    client.email = email || client.email;
    client.mobileNumber = mobileNumber || client.mobileNumber;
    client.companyName = companyName !== undefined ? companyName : client.companyName;
    client.industryOrWorkType = industryOrWorkType || client.industryOrWorkType;

    await client.save();
    
    const updatedClient = client.toObject();
    delete updatedClient.password;

    res.status(200).json({ message: 'Profile updated successfully', client: updatedClient });
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Student Profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const { name, email, mobileNumber, classOrYear, schoolOrCollegeName, enrollmentNumber, skills, bio, projectLinks } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.name = name || student.name;
    student.email = email || student.email;
    student.mobileNumber = mobileNumber || student.mobileNumber;
    student.classOrYear = classOrYear || student.classOrYear;
    student.schoolOrCollegeName = schoolOrCollegeName || student.schoolOrCollegeName;
    student.enrollmentNumber = enrollmentNumber || student.enrollmentNumber;
    student.skills = skills !== undefined ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean)) : student.skills;
    student.bio = bio !== undefined ? bio : student.bio;
    student.projectLinks = projectLinks !== undefined ? projectLinks : student.projectLinks;

    await student.save();

    const updatedStudent = student.toObject();
    delete updatedStudent.password;

    res.status(200).json({ message: 'Profile updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Error in updateStudentProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Student Freelancers
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Re-upload Student ID Card (Retry Verification)
exports.reuploadIdCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { idCardImage } = req.body;

    if (!idCardImage) {
      return res.status(400).json({ message: 'A valid student ID card image is required.' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 100% Automated Verification Engine
    let verificationStatus = 'pending';
    let rejectionReason = '';

    const academicDomains = ['.edu', '.ac.in', '.edu.in', '.res.in'];
    const isAcademicEmail = academicDomains.some(domain => student.email.toLowerCase().endsWith(domain));

    if (isAcademicEmail) {
      verificationStatus = 'verified';
    } else if (idCardImage && idCardImage.startsWith('data:image')) {
      try {
        const Tesseract = require('tesseract.js');
        const base64Data = idCardImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const ocrResult = await Tesseract.recognize(imageBuffer, 'eng');
        const text = ocrResult.data.text || '';
        const normalizedText = text.toLowerCase();
        
        // 1. Name Match
        const normalizedName = student.name.toLowerCase();
        const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
        const nameMatched = normalizedText.includes(normalizedName) || 
                            (nameWords.length > 0 && nameWords.every(w => normalizedText.includes(w)));
                            
        // 2. College Match
        const normalizedCollege = student.schoolOrCollegeName.toLowerCase();
        const collegeWords = normalizedCollege.split(/\s+/).filter(w => w.length > 3 && w !== 'college' && w !== 'university');
        const collegeMatched = normalizedText.includes(normalizedCollege) || 
                               (collegeWords.length > 0 && collegeWords.some(w => normalizedText.includes(w)));
                               
        // 3. Enrollment Match
        const normalizedEnrollment = student.enrollmentNumber.toLowerCase();
        const enrollmentMatched = normalizedText.includes(normalizedEnrollment);
        
        // Evaluate OCR checks
        if (!nameMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Could not detect your name "${student.name}" on the uploaded student ID card image. Please ensure the image is clear and matches your profile.`;
        } else if (!collegeMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Could not detect your institution name "${student.schoolOrCollegeName}" on the ID card. Please ensure the card text is clear.`;
        } else if (!enrollmentMatched) {
          verificationStatus = 'rejected';
          rejectionReason = `Auto-verification failed: Enrollment number "${student.enrollmentNumber}" was not found on the ID card. Please ensure the number matches exactly.`;
        } else {
          verificationStatus = 'verified';
        }
      } catch (ocrErr) {
        console.error('OCR Processing failed:', ocrErr);
        verificationStatus = 'rejected';
        rejectionReason = 'Auto-verification failed: Unable to process the uploaded ID card image. Please upload a clear image in PNG or JPG format.';
      }
    } else {
      verificationStatus = 'rejected';
      rejectionReason = 'Auto-verification failed: A valid student ID card image is required.';
    }

    student.idCardImage = idCardImage;
    student.verificationStatus = verificationStatus;
    student.rejectionReason = rejectionReason;

    await student.save();

    res.status(200).json({
      message: 'ID Card re-uploaded and processed successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        verificationStatus,
        rejectionReason,
        idCardImage: student.idCardImage
      }
    });
  } catch (error) {
    console.error('Error in reuploadIdCard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


