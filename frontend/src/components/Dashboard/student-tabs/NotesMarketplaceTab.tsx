import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Star, 
  Upload, 
  CheckCircle, 
  Info, 
  TrendingUp,
  X
} from 'lucide-react';
import type { StudentProfile, Note, NoteReview } from './types';

interface NotesMarketplaceTabProps {
  studentProfile: StudentProfile;
}

export const NotesMarketplaceTab: React.FC<NotesMarketplaceTabProps> = ({ studentProfile }) => {
  const userId = sessionStorage.getItem('userId');

  // View tabs inside marketplace: 'browse' | 'sell'
  const [marketSubTab, setMarketSubTab] = useState<'browse' | 'sell'>('browse');

  // Marketplace states
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Sell form states
  const [sellForm, setSellForm] = useState({
    title: '',
    subject: '',
    description: '',
    price: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [extractedPreviews, setExtractedPreviews] = useState<string[]>([]);
  const [uploadingNote, setUploadingNote] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Note Detail modal states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [purchasingNote, setPurchasingNote] = useState(false);
  
  // Review form states inside modal
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch listed notes
  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const response = await fetch('http://localhost:5000/api/notes', {
        headers: {
          'x-user-id': userId || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to load notes marketplace catalog:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId, marketSubTab]);

  // Handle File upload mapping to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setExtractedPreviews([]); // Reset previous previews

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setFileBase64(base64String);

        // If the selected file is a PDF, dynamically extract the first 2 pages as high-quality JPEGs
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            const pdfjs = (window as any).pdfjsLib;

            if (pdfjs) {
              const arrayBuffer = await file.arrayBuffer();
              // Wrap the raw arrayBuffer in a Uint8Array (required by PDF.js)
              const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
              const pdf = await loadingTask.promise;
              const pagesToExtract = Math.min(pdf.numPages, 2);
              const previews: string[] = [];

              for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  await page.render({ canvasContext: context, viewport }).promise;
                  const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                  previews.push(imgDataUrl);
                }
              }
              setExtractedPreviews(previews);
              console.log("Successfully extracted high-fidelity PDF page previews!", previews.length);
            } else {
              console.warn('PDF.js library was not found on the window. Falling back to text summary.');
            }
          } catch (err) {
            console.error('Error generating document page previews:', err);
          }
        } else if (file.name.endsWith('.docx')) {
          try {
            const JSZip = (window as any).JSZip;
            if (JSZip) {
              const arrayBuffer = await file.arrayBuffer();
              const zip = await JSZip.loadAsync(arrayBuffer);
              const docXmlFile = zip.file("word/document.xml");
              if (docXmlFile) {
                const docXml = await docXmlFile.async("string");
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(docXml, "text/xml");
                const paragraphs = xmlDoc.getElementsByTagName("w:p");
                let extractedTextLines: string[] = [];

                for (let i = 0; i < paragraphs.length; i++) {
                  const texts = paragraphs[i].getElementsByTagName("w:t");
                  let pText = "";
                  for (let j = 0; j < texts.length; j++) {
                    pText += texts[j].textContent || "";
                  }
                  if (pText.trim()) {
                    extractedTextLines.push(pText.trim());
                  }
                }

                // Segment the extracted paragraphs into two readable preview sheets
                const midPoint = Math.ceil(extractedTextLines.length / 2);
                const page1Text = extractedTextLines.slice(0, Math.min(midPoint, 12)).join("\n\n");
                const page2Text = extractedTextLines.slice(midPoint, Math.min(midPoint + 12, extractedTextLines.length)).join("\n\n");

                setExtractedPreviews([
                  `[PAGE 1 PREVIEW]\n\n${page1Text || 'No readable text content found in first segment.'}\n\n--- WATERMARK: PREVIEW COPY - CAMPUSLANCE SECURED ---`,
                  `[PAGE 2 PREVIEW]\n\n${page2Text || 'No readable text content found in second segment.'}\n\n--- WATERMARK: PREVIEW COPY - PURCHASE TO UNLOCK FULL NOTES FILE ---`
                ]);
                console.log("Successfully extracted high-fidelity Word doc text previews!");
              } else {
                console.warn('Could not locate word/document.xml in Word file folder.');
              }
            } else {
              console.warn('JSZip was not found on the window. Falling back to text summary.');
            }
          } catch (err) {
            console.error('Error parsing Word document text:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellForm.title || !sellForm.price || !fileBase64 || !selectedFile) {
      alert('Please fill in all required parameters and choose a PDF or Word notes file.');
      return;
    }

    if (studentProfile.verificationStatus !== 'verified') {
      alert('Access Restricted: Only verified student profiles are permitted to list academic resources for sale.');
      return;
    }

    setUploadingNote(true);
    setUploadMessage('');

    try {
      const payload = {
        title: sellForm.title,
        description: sellForm.description,
        subject: sellForm.subject || 'General',
        price: parseFloat(sellForm.price) || 0,
        fileData: fileBase64,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        sellerId: userId || '',
        previewData: extractedPreviews
      };

      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setUploadMessage('🎉 Notes published successfully! Your resources are now live in the campus directory.');
        setSellForm({ title: '', subject: '', description: '', price: '' });
        setSelectedFile(null);
        setFileBase64('');
        setExtractedPreviews([]);
        setTimeout(() => {
          setUploadMessage('');
          setMarketSubTab('browse');
        }, 2000);
      } else {
        alert(`Upload error: ${data.message}`);
      }
    } catch (err) {
      console.error('Notes upload networking failure:', err);
      alert('Failed to connect to backend upload api.');
    } finally {
      setUploadingNote(false);
    }
  };

  // Handle Note details open (re-fetches detail to get full payload if purchased)
  const handleOpenDetails = async (noteId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        headers: {
          'x-user-id': userId || ''
        }
      });
      if (response.ok) {
        const detail = await response.json();
        setSelectedNote(detail);
      }
    } catch (err) {
      console.error('Failed to fetch specific note detail:', err);
    }
  };

  // Handle Note Purchase Action
  const handlePurchase = async () => {
    if (!selectedNote || !userId) return;

    setPurchasingNote(true);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${selectedNote._id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ buyerId: userId })
      });

      const data = await response.json();
      if (response.ok) {
        alert('🎉 Success! notes unlocked. You can now download the high-quality notes PDF.');
        // Refresh details which includes full fileData unlocked
        handleOpenDetails(selectedNote._id);
        fetchNotes();
      } else {
        alert(`Transaction failure: ${data.message}`);
      }
    } catch (err) {
      console.error('Purchase action failed:', err);
      alert('Network error completing transaction.');
    } finally {
      setPurchasingNote(false);
    }
  };

  // Trigger Browser Download
  const handleDownload = () => {
    if (!selectedNote || !selectedNote.fileData) return;

    try {
      const link = document.createElement('a');
      link.href = selectedNote.fileData;
      link.download = selectedNote.fileName || 'academic_notes.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Trigger download link block error:', err);
    }
  };

  // Submit Text-Only Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !userId || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${selectedNote._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerId: userId,
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('⭐ Review submitted successfully!');
        setReviewComment('');
        setReviewRating(5);
        // Refresh detail view
        handleOpenDetails(selectedNote._id);
      } else {
        alert(`Review error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error leaving review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Search/Filters calculations
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Calculate unique subjects listed in notes
  const availableSubjects = ['All', ...Array.from(new Set(notes.map(n => n.subject).filter(Boolean)))];

  // Helper rating calc
  const getAverageRating = (reviews: NoteReview[]) => {
    if (!reviews || reviews.length === 0) return 'No reviews';
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (selectedNote) {
    return (
      <div className="screen-fade-in notes-marketplace-screen">
        
        {/* Navigation & Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button 
            onClick={() => setSelectedNote(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--dash-border)',
              color: 'var(--dash-text-h)',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Back to Campus Library
          </button>

          <span className="gig-category" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px' }}>
            {selectedNote.subject} • Academic Resource Detail
          </span>
        </div>

        {/* Large Workspace Body */}
        <div className="bg-glass" style={{ padding: '35px', borderRadius: '20px', minHeight: '75vh', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Left Column: Core Metadata, Seller Info, Reviews, Purchase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Title Block */}
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--dash-text-h)', margin: '0 0 8px', lineHeight: '1.25' }}>
                {selectedNote.title}
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--dash-text)' }}>
                Published by: <strong style={{ color: 'var(--dash-text-h)' }}>{selectedNote.sellerName}</strong>
              </p>
              <span style={{ fontSize: '12px', display: 'inline-block', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--dash-border)', borderRadius: '6px', marginTop: '8px', color: 'var(--dash-text)' }}>
                File: {selectedNote.fileName || 'academic_notes.pdf'} ({selectedNote.fileType.split('/')[1]?.toUpperCase() || 'Document'})
              </span>
            </div>

            {/* Description Block */}
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--dash-border)', borderRadius: '12px', padding: '20px' }}>
              <h5 style={{ fontSize: '15px', color: 'var(--dash-text-h)', margin: '0 0 10px', fontWeight: 600 }}>Description Overview</h5>
              <p style={{ fontSize: '13.5px', color: 'var(--dash-text)', lineHeight: '1.5', margin: 0 }}>
                {selectedNote.description || 'No detailed overview provided for this academic resource.'}
              </p>
            </div>

            {/* Secure Download / Purchase Box */}
            {selectedNote.fileData ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '24px', borderRadius: '14px', textAlign: 'center' }}>
                <h5 style={{ color: '#10b981', margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>✓ Access Fully Unlocked</h5>
                <p style={{ fontSize: '12.5px', color: 'var(--dash-text)', margin: '0 0 16px' }}>You have purchased this resource. Click below to download the high-quality source file.</p>
                <button 
                  onClick={handleDownload} 
                  className="btn-primary" 
                  style={{ background: '#10b981', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                >
                  <Download size={18} /> Save Source File
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--dash-border)', padding: '24px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--dash-text)', textTransform: 'uppercase', fontWeight: 600 }}>Purchase Price</span>
                <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', margin: '4px 0 16px' }}>
                  {selectedNote.price === 0 ? 'Free' : `$${selectedNote.price}`}
                </h3>
                <button 
                  onClick={handlePurchase} 
                  className="btn-primary" 
                  disabled={purchasingNote}
                  style={{ border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                >
                  {purchasingNote ? 'Processing Wallet Purchase...' : `💳 Purchase Resource`}
                </button>
                <p style={{ fontSize: '11px', color: 'var(--dash-text)', margin: '10px 0 0' }}>Instant download unlocked immediately upon payment approval.</p>
              </div>
            )}

            {/* Peer Reviews Workspace */}
            <div>
              <h5 style={{ fontSize: '15px', color: 'var(--dash-text-h)', margin: '0 0 12px', fontWeight: 600 }}>Peer Feedback</h5>
              
              {/* Leave review form */}
              {selectedNote.fileData && userId && selectedNote.sellerId.toString() !== userId && !selectedNote.reviews.some(r => r.reviewerId.toString() === userId) && (
                <form onSubmit={handleReviewSubmit} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--dash-border)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                  <h6 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--dash-text-h)' }}>Leave your review</h6>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>Your Rating:</span>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button 
                        key={num} 
                        type="button" 
                        onClick={() => setReviewRating(num)}
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}
                      >
                        <Star size={16} fill={reviewRating >= num ? "gold" : "none"} stroke={reviewRating >= num ? "gold" : "#cbd5e1"} />
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="E.g. Format is very clear, helped me ace my midterm!" 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--dash-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--dash-text-h)', outline: 'none', marginBottom: '10px' }}
                  />
                  <button type="submit" className="btn-primary" disabled={submittingReview} style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px' }}>
                    {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Scrollable Reviews Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                {selectedNote.reviews.length > 0 ? (
                  selectedNote.reviews.map((rev, idx) => (
                    <div key={idx} style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--dash-border)', borderRadius: '10px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--dash-text-h)' }}>{rev.reviewerName}</strong>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={11} fill={rev.rating >= n ? "gold" : "none"} stroke={rev.rating >= n ? "gold" : "#cbd5e1"} />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--dash-text)', lineHeight: '1.4' }}>{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12.5px', color: 'var(--dash-text)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No customer reviews recorded yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: HUGE Watermarked Document Previewer Workspace */}
          <div style={{ borderLeft: '1px solid var(--dash-border)', paddingLeft: '35px' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--dash-text-h)', margin: '0 0 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📚 Interactive Document Preview
            </h4>

            {/* Preview Sheet Scrolling Container - taking large screen space */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* Page 1 Sheet */}
              <div style={{
                background: '#fff',
                color: '#000',
                border: '1px solid #cbd5e1',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: selectedNote.previewData[0]?.startsWith('data:image/') ? '12px' : '30px',
                minHeight: '480px',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'monospace',
                fontSize: '12.5px',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                {/* Watermark Diagonal Overlay */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)',
                  fontSize: '16px', color: 'rgba(0, 0, 0, 0.08)', fontWeight: 800, pointerEvents: 'none', whiteSpace: 'nowrap',
                  border: '2px dashed rgba(0,0,0,0.08)', padding: '10px', zIndex: 10
                }}>
                  PREVIEW VERSION • CAMPUSLANCE
                </div>
                {selectedNote.previewData[0]?.startsWith('data:image/') ? (
                  <img 
                    src={selectedNote.previewData[0]} 
                    style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', borderRadius: '4px' }} 
                    alt="Page 1 Preview" 
                  />
                ) : (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', color: '#1e293b' }}>
                    {selectedNote.previewData[0] || 'Page 1 Preview loading...'}
                  </pre>
                )}
              </div>

              {/* Page 2 Sheet */}
              <div style={{
                background: '#fff',
                color: '#000',
                border: '1px solid #cbd5e1',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: selectedNote.previewData[1]?.startsWith('data:image/') ? '12px' : '30px',
                minHeight: '480px',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'monospace',
                fontSize: '12.5px',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                {/* Watermark Diagonal Overlay */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)',
                  fontSize: '16px', color: 'rgba(0, 0, 0, 0.08)', fontWeight: 800, pointerEvents: 'none', whiteSpace: 'nowrap',
                  border: '2px dashed rgba(0,0,0,0.08)', padding: '10px', zIndex: 10
                }}>
                  PREVIEW VERSION • CAMPUSLANCE
                </div>
                {selectedNote.previewData[1]?.startsWith('data:image/') ? (
                  <img 
                    src={selectedNote.previewData[1]} 
                    style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', borderRadius: '4px' }} 
                    alt="Page 2 Preview" 
                  />
                ) : (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', color: '#1e293b' }}>
                    {selectedNote.previewData[1] || 'Page 2 Preview loading...'}
                  </pre>
                )}
              </div>

              {/* Page 3 Locked Blur Sheet */}
              <div style={{
                background: '#e2e8f0',
                color: '#64748b',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '40px 30px',
                textAlign: 'center',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{ filter: 'blur(2px)', fontSize: '11px', lineHeight: '1.4', pointerEvents: 'none', userSelect: 'none' }}>
                  [PAGE 3 LOCKED CONTENT]
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac sapien lorem. Vivamus finibus finibus felis eu porta. Duis sit amet convallis lacus. Phasellus a pulvinar erat.
                  [PAGE 4 LOCKED CONTENT]
                  Donec tempor interdum lacus at condimentum. Mauris vel tellus sit amet libero cursus convallis.
                </div>
                <div style={{
                  position: 'absolute', width: '100%', height: '100%', top: 0, left: 0,
                  background: 'rgba(15, 23, 42, 0.82)', borderRadius: '8px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', color: '#fff', padding: '16px'
                }}>
                  <Info size={24} style={{ color: '#ec4899', marginBottom: '8px' }} />
                  <h6 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Remaining Pages are Locked</h6>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1' }}>Purchase this resource to fully unlock and save the file.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="screen-fade-in notes-marketplace-screen">
      
      {/* Dynamic Title Banner */}
      <div className="screen-title-banner" style={{ marginBottom: '30px' }}>
        <h1>Peer-to-Peer Notes Marketplace</h1>
        <p>A high-end academic directory where student peers upload, sell, and buy course presentation decks, study templates, and core lecture materials.</p>
      </div>

      {/* Internal Sub-tabs Navigation */}
      <div className="tab-navigation-bar" style={{ display: 'flex', gap: '15px', marginBottom: '24px', borderBottom: '1px solid var(--dash-border)', paddingBottom: '14px' }}>
        <button 
          className={`btn-filter-tab ${marketSubTab === 'browse' ? 'active' : ''}`}
          onClick={() => setMarketSubTab('browse')}
          style={{
            background: marketSubTab === 'browse' ? 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.04)',
            color: marketSubTab === 'browse' ? '#fff' : 'var(--dash-text-h)',
            border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          🛒 Browse Campus Library
        </button>
        <button 
          className={`btn-filter-tab ${marketSubTab === 'sell' ? 'active' : ''}`}
          onClick={() => setMarketSubTab('sell')}
          style={{
            background: marketSubTab === 'sell' ? 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.04)',
            color: marketSubTab === 'sell' ? '#fff' : 'var(--dash-text-h)',
            border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          📤 List & Manage Notes
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. BROWSE NOTES TAB VIEW                                      */}
      {/* ============================================================== */}
      {marketSubTab === 'browse' && (
        <div>
          {/* Search Filters Row */}
          <div className="explore-search-bar bg-glass" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', padding: '16px', marginBottom: '24px', borderRadius: '14px' }}>
            <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', border: '1px solid var(--dash-border)', borderRadius: '10px', padding: '10px 16px' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search notes by subject, title, or student author..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--dash-text-h)', width: '100%', outline: 'none', fontSize: '14px' }}
              />
            </div>
            <div className="filter-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', border: '1px solid var(--dash-border)', borderRadius: '10px', padding: '10px 16px' }}>
              <Filter size={18} />
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--dash-text-h)', width: '100%', outline: 'none', fontSize: '14px' }}
              >
                {availableSubjects.map((sub, i) => (
                  <option value={sub} key={i}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid list of marketplace notes */}
          {loadingNotes ? (
            <p style={{ textAlign: 'center', margin: '40px 0' }}>Loading notes directories...</p>
          ) : filteredNotes.length > 0 ? (
            <div className="gigs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredNotes.map((note) => {
                const isOwner = userId && note.sellerId.toString() === userId;
                const purchased = userId && note.buyers.some(b => b.toString() === userId);
                
                return (
                  <div 
                    className="gig-card bg-glass" 
                    key={note._id}
                    onClick={() => handleOpenDetails(note._id)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', borderRadius: '14px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="gig-category" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>{note.subject}</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                          {note.price === 0 ? 'Free' : `$${note.price}`}
                        </span>
                      </div>
                      
                      <h4 className="gig-title" style={{ fontSize: '17px', color: 'var(--dash-text-h)', margin: '8px 0', fontWeight: 600, lineHeight: '1.2' }}>{note.title}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--dash-text)', margin: '0 0 14px' }}>Published by: <strong>{note.sellerName}</strong></p>
                      
                      <p className="gig-desc" style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--dash-text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: '16px' }}>
                        {note.description || 'No detailed course notes overview specified.'}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Star size={14} fill="gold" stroke="gold" />
                        <span style={{ fontWeight: 600, color: 'var(--dash-text-h)' }}>{getAverageRating(note.reviews)}</span>
                        {note.reviews.length > 0 && <span style={{ color: 'var(--dash-text)' }}>({note.reviews.length})</span>}
                      </div>

                      {/* Display visual tag status */}
                      {isOwner ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)', padding: '4px 10px', borderRadius: '6px' }}>Your Upload</span>
                      ) : purchased ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '4px 10px', borderRadius: '6px' }}>Purchased ✓</span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px' }}>Buy Resource</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results bg-glass" style={{ textAlign: 'center', padding: '40px', borderRadius: '14px' }}>
              <Info size={36} />
              <h3 style={{ margin: '14px 0 6px', color: 'var(--dash-text-h)' }}>No notes listed in peer search</h3>
              <p>Be the pioneer of this subject by list and manage notes in the adjacent tab!</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LIST & SELL NOTES TAB VIEW                                  */}
      {/* ============================================================== */}
      {marketSubTab === 'sell' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
          
          {/* Upload Notes Form */}
          <form className="task-creation-form bg-glass" onSubmit={handleUploadSubmit} style={{ padding: '24px', borderRadius: '16px' }}>
            <h3>Publish Notes</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--dash-text)', marginBottom: '20px' }}>Set your resource description and prices. Once verified, other university peers can buy your document files directly.</p>

            {uploadMessage && (
              <div className="alert-success" style={{ marginBottom: '20px' }}>
                <CheckCircle size={18} />
                <span>{uploadMessage}</span>
              </div>
            )}

            <div className="form-group-dash">
              <label>Notes Title *</label>
              <input 
                type="text" 
                placeholder="e.g. CS101 final exam condensed lecture notes (Syllabus 2026)" 
                value={sellForm.title} 
                onChange={(e) => setSellForm({ ...sellForm, title: e.target.value })}
                required 
              />
            </div>

            <div className="form-row-dash" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group-dash">
                <label>Subject / Category *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science, Chemistry" 
                  value={sellForm.subject} 
                  onChange={(e) => setSellForm({ ...sellForm, subject: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group-dash">
                <label>Price ($) *</label>
                <input 
                  type="number" 
                  placeholder="e.g. 15 (Set 0 for free notes)" 
                  value={sellForm.price} 
                  onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })}
                  required 
                  min="0"
                />
              </div>
            </div>

            <div className="form-group-dash">
              <label>Academic Description *</label>
              <textarea 
                rows={4}
                placeholder="List topics covered, textbook chapters referenced, and formula sets included. A high-quality description drives more downloads!"
                value={sellForm.description}
                onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="form-group-dash" style={{ margin: '15px 0' }}>
              <label>Upload Document File * (.pdf or Word format)</label>
              <div style={{
                border: '2px dashed var(--dash-border)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.01)',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc" 
                  onChange={handleFileChange}
                  required
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                  }}
                />
                <Upload size={32} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                <h6>{selectedFile ? selectedFile.name : 'Select PDF or Word File'}</h6>
                <p style={{ fontSize: '11px', color: 'var(--dash-text)', margin: '4px 0 0' }}>
                  {selectedFile ? `${(selectedFile.size/1024/1024).toFixed(2)} MB • Click to replace` : 'Maximum file size: 50MB'}
                </p>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={uploadingNote} style={{ width: '100%', marginTop: '10px' }}>
              {uploadingNote ? 'Uploading Notes Payload...' : '📤 Publish Notes to Peer Library'}
            </button>
          </form>

          {/* User's listed files and sales summary widget */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="bg-glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 14px', fontSize: '16px', color: 'var(--dash-text-h)' }}>
                <TrendingUp size={18} style={{ color: '#10b981' }} /> Active Sales Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--dash-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--dash-text)' }}>Total Listed</span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '24px', color: 'var(--dash-text-h)' }}>
                    {notes.filter(n => userId && n.sellerId.toString() === userId).length}
                  </h3>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--dash-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--dash-text)' }}>Earnings Realized</span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '24px', color: '#10b981' }}>
                    ${notes.filter(n => userId && n.sellerId.toString() === userId)
                           .reduce((sum, n) => sum + (n.price * n.buyers.length), 0)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-glass" style={{ padding: '24px', borderRadius: '16px', flex: '1' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--dash-text-h)' }}>Your Published Notes</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {notes.filter(n => userId && n.sellerId.toString() === userId).length > 0 ? (
                  notes.filter(n => userId && n.sellerId.toString() === userId).map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => handleOpenDetails(n._id)}
                      style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--dash-border)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ minWidth: 0, paddingRight: '10px' }}>
                        <h6 className="truncate" style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--dash-text-h)' }}>{n.title}</h6>
                        <span style={{ fontSize: '10px', color: 'var(--dash-text)' }}>Subject: {n.subject}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'block' }}>${n.price}</span>
                        <span style={{ fontSize: '10px', color: 'var(--dash-text)' }}>{n.buyers.length} downloads</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--dash-text)', textAlign: 'center', margin: '30px 0' }}>No academic files published yet.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
