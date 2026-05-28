const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Student = require('../models/Student');

// 1. Upload a New Note
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, price, fileData, fileName, fileType, sellerId } = req.body;

    if (!title || !price || !fileData || !fileName || !fileType || !sellerId) {
      return res.status(400).json({ message: 'Missing required parameters for note upload.' });
    }

    const student = await Student.findById(sellerId);
    if (!student) {
      return res.status(404).json({ message: 'Seller student account not found.' });
    }

    // Use client-provided high-fidelity extracted pages if available (e.g. PDF rendered to base64 images),
    // otherwise generate elegant high-end simulated watermarked text.
    let previewData = req.body.previewData;
    if (!previewData || !Array.isArray(previewData) || previewData.length === 0) {
      previewData = [
        `[PAGE 1 PREVIEW]\nSubject: ${subject || 'General'}\nTitle: ${title}\nPresented By: ${student.name} (${student.schoolOrCollegeName})\n\nDescription: ${description || 'No additional summary provided.'}\n\nTable of Contents:\n1. Core Introduction and Terminology\n2. Key Formulas & Theories\n3. Practical Case Applications\n4. Review Questions & Summary\n\n--- WATERMARK: PREVIEW COPY - CAMPUSLANCE SECURED ---`,
        `[PAGE 2 PREVIEW]\nSection 1: Core Concepts & Principles\n\nThis presentation slides/notes deck covers detailed outlines compiled directly from course lectures. In this segment, we address the primary foundations and explore practical examples used in assignments.\n\nKey Concepts Covered:\n- Primary Theories: Overview, core principles, and direct formulas.\n- Methodologies: Step-by-step resolution of syllabus problems.\n- Exam Hacks: Crucial focus points highlighted by professors.\n\n--- WATERMARK: PREVIEW COPY - PURCHASE TO UNLOCK FULL NOTES FILE ---`
      ];
    }

    const note = new Note({
      title,
      description: description || '',
      subject: subject || 'General',
      price: parseFloat(price) || 0,
      sellerId: student._id,
      sellerName: student.name,
      fileData,
      fileName,
      fileType,
      previewData,
      buyers: [],
      reviews: []
    });

    await note.save();

    res.status(201).json({ message: 'Academic notes uploaded and published successfully!', noteId: note._id });
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Server error uploading note', error: error.message });
  }
});

// 2. Fetch All Listed Notes (Copy Protected Payload Response)
router.get('/', async (req, res) => {
  try {
    const requesterId = req.headers['x-user-id']; // Client sends their student userId

    const notes = await Note.find().sort({ createdAt: -1 });

    // Copy-protection filter: Strip the complete base64 fileData unless requested by owner or active buyer
    const secureNotesList = notes.map(note => {
      const isOwner = requesterId && note.sellerId.toString() === requesterId;
      const hasPurchased = requesterId && note.buyers.some(bId => bId.toString() === requesterId);

      const noteObject = note.toObject();
      if (!isOwner && !hasPurchased) {
        delete noteObject.fileData; // Strip the big base64 payload to prevent theft!
      }
      return noteObject;
    });

    res.status(200).json(secureNotesList);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error fetching notes', error: error.message });
  }
});

// 3. Fetch Single Note Detail (Copy Protected Payload Response)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.headers['x-user-id'];

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Academic resource notes not found.' });
    }

    const isOwner = requesterId && note.sellerId.toString() === requesterId;
    const hasPurchased = requesterId && note.buyers.some(bId => bId.toString() === requesterId);

    const noteObject = note.toObject();
    if (!isOwner && !hasPurchased) {
      delete noteObject.fileData; // Hide file download payload
    }

    res.status(200).json(noteObject);
  } catch (error) {
    console.error('Error fetching note details:', error);
    res.status(500).json({ message: 'Server error fetching note details', error: error.message });
  }
});

// 4. Purchase a Note (Mock Balance/Wallet Transactions)
router.post('/:id/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;

    if (!buyerId) {
      return res.status(400).json({ message: 'Missing buyerId to initiate purchase transaction.' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Notes resource not found.' });
    }

    const buyer = await Student.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Student buyer account not found.' });
    }

    // Check if already purchased
    const alreadyBought = note.buyers.some(bId => bId.toString() === buyer._id.toString());
    if (alreadyBought) {
      return res.status(400).json({ message: 'You have already purchased these notes!' });
    }

    // Check if trying to buy own notes
    if (note.sellerId.toString() === buyer._id.toString()) {
      return res.status(400).json({ message: 'You cannot purchase your own uploaded notes!' });
    }

    // Simulating transaction processing (No Stripe needed for notes sandbox wallet)
    note.buyers.push(buyer._id);
    await note.save();

    res.status(200).json({ 
      message: 'Notes purchased successfully! Safe wallet download is now fully unlocked.', 
      noteId: note._id, 
      fileData: note.fileData // Send file data back to client to enable download instantly!
    });
  } catch (error) {
    console.error('Error purchasing notes:', error);
    res.status(500).json({ message: 'Server error during notes purchase', error: error.message });
  }
});

// 5. Submit Note Review & Rating (Text-Only Comments, Verified Buyers Only)
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, rating, comment } = req.body;

    if (!reviewerId || !rating || !comment) {
      return res.status(400).json({ message: 'Review requires reviewerId, rating (1-5), and a text comment.' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Notes resource not found.' });
    }

    const reviewer = await Student.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ message: 'Student reviewer account not found.' });
    }

    // Verify student actually bought the note before leaving a review!
    const isBuyer = note.buyers.some(bId => bId.toString() === reviewer._id.toString());
    const isSeller = note.sellerId.toString() === reviewer._id.toString();
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Only verified buyers can leave a rating & review.' });
    }

    // Prevent duplicate reviews from the same buyer
    const alreadyReviewed = note.reviews.some(r => r.reviewerId.toString() === reviewer._id.toString());
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed these notes!' });
    }

    const newReview = {
      reviewerId: reviewer._id,
      reviewerName: reviewer.name,
      rating: parseInt(rating) || 5,
      comment: comment.trim(),
      reviewedAt: new Date()
    };

    note.reviews.push(newReview);
    await note.save();

    res.status(201).json({ message: 'Your review was submitted and verified successfully!', note });
  } catch (error) {
    console.error('Error submitting notes review:', error);
    res.status(500).json({ message: 'Server error submitting notes review', error: error.message });
  }
});

module.exports = router;
