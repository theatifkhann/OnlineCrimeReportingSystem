import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ChevronRight, ChevronLeft, UploadCloud, MapPin, ShieldAlert, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Make sure to import the CSS file we created in the previous step!
import './FileReport.css';

function ReportForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Combined form data state for cleaner wizard management
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
  });
  const [file, setFile] = useState(null); // Kept for future use

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Report submitted to database successfully!");

        // Reset form
        setFormData({ title: '', description: '', location: '' });
        setFile(null);
        setStep(1);
      } else {
        toast.error(data.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error. Could not reach servers.");
    } finally {
      setLoading(false);
    }
  };

  // Staggered animation variants matching your prompt
  const formVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
  };

  return (
    <div className="report-wrapper">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="hero-title">File a New Complaint</h1>
        <p className="hero-subtitle">Provide exact details to log this incident in the database.</p>

        {/* Progress Indicator */}
        <div className="progress-container">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <ShieldAlert size={14} /> 01 Incident
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <MapPin size={14} /> 02 Location
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <CheckCircle size={14} /> 03 Review
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <AnimatePresence mode="wait">

            {/* STEP 1: Incident Details */}
            {step === 1 && (
              <motion.div key="step1" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <div className="input-group">
                  <label className="input-label">Incident Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    placeholder="e.g., Vehicle Theft on 5th Ave"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Detailed Description</label>
                  <textarea
                    name="description"
                    className="form-input"
                    placeholder="Provide as much detail as possible about the incident..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Location & Media */}
            {step === 2 && (
              <motion.div key="step2" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <div className="input-group">
                  <label className="input-label">Exact Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    placeholder="Street address or distinct landmark"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Attach Evidence (Future feature)</label>
                  <label className="dropzone">
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <UploadCloud size={32} color="var(--color-primary)" style={{ marginBottom: '10px' }} />
                    <div style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {file ? file.name : "Click to upload or drag files here"}
                    </div>
                    {/* FIXED: Was white with 0.4 opacity, now uses secondary text variable */}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PNG, JPG, MP4 up to 50MB</div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <motion.div key="step3" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                {/* FIXED: Was color: '#fff', now uses var(--text-primary) */}
                <h3 style={{ fontFamily: 'Syne', fontSize: '20px', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Review Submission</h3>
                <div className="review-block">
                  <label className="input-label">System Timestamp</label>
                  <div className="review-code" style={{ color: 'var(--color-primary)' }}>
                    {new Date().toLocaleString('en-US', {
                      year: 'numeric', month: 'short', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </div>
                </div>
                <div className="review-block">
                  <label className="input-label">Title</label>
                  {/* FIXED: Error text now uses var(--color-danger) */}
                  <div className="review-data">{formData.title || <span style={{ color: 'var(--color-danger)' }}>Missing Title</span>}</div>
                </div>

                <div className="review-block">
                  <label className="input-label">Location</label>
                  {/* FIXED: Error text now uses var(--color-danger) */}
                  <div className="review-data">{formData.location || <span style={{ color: 'var(--color-danger)' }}>Missing Location</span>}</div>
                </div>

                <div className="review-block">
                  <label className="input-label">Attached Evidence</label>
                  <div className="review-data">{file ? file.name : 'None attached'}</div>
                </div>

                <div className="review-block" style={{ borderBottom: 'none' }}>
                  <label className="input-label">Description</label>
                  {/* FIXED: Was white with 0.8 opacity, now uses secondary text variable */}
                  <div className="review-data" style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {formData.description || <span style={{ color: 'var(--color-danger)' }}>Missing Description</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="button-group">
            {step > 1 ? (
              <button className="btn btn-secondary" onClick={handlePrev}>
                <ChevronLeft size={18} /> Back
              </button>
            ) : <div></div>} {/* Empty div keeps Next button aligned right */}

            {step < 3 ? (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={
                  (step === 1 && (!formData.title || !formData.description)) ||
                  (step === 2 && !formData.location)
                }
                style={{
                  opacity: ((step === 1 && (!formData.title || !formData.description)) || (step === 2 && !formData.location)) ? 0.5 : 1
                }}
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Transmitting...' : 'Submit to Database'} <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ReportForm;
