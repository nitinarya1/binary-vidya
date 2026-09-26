'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Calendar,
  Clock,
  Upload,
  Image as ImageIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { compressThumbnail } from '../lib/imageCompressor';

export interface ProgramOption {
  id: string;
  title: string;
  slug?: string;
}

export interface ScheduleLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (session: any) => void;
  courses: ProgramOption[];
  trainingPrograms: ProgramOption[];
  instructorName: string;
  instructorEmail: string;
}

export function ScheduleLiveModal({
  isOpen,
  onClose,
  onSaved,
  courses,
  trainingPrograms,
  instructorName,
  instructorEmail,
}: ScheduleLiveModalProps) {
  const [targetType, setTargetType] = useState<'course' | 'internship'>('internship');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default DateTime to today + 2 hours rounded to the nearest half hour
  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      d.setMinutes(0, 0, 0);
      const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(isoLocal);
      setErrorMsg('');

      // Auto-select first program option if none selected
      const currentList = targetType === 'internship' ? trainingPrograms : courses;
      if (currentList.length > 0 && !selectedProgramId) {
        setSelectedProgramId(currentList[0].id);
        setTitle(`${currentList[0].title} — Weekend Live Masterclass`);
      }
    }
  }, [isOpen, targetType, trainingPrograms, courses]);

  // When program or targetType switches, update title hint
  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const list = targetType === 'internship' ? trainingPrograms : courses;
    const found = list.find((p) => p.id === progId);
    if (found) {
      setTitle(`${found.title} — Weekend Live Masterclass`);
    }
  };

  const handleTargetTypeChange = (type: 'course' | 'internship') => {
    setTargetType(type);
    const list = type === 'internship' ? trainingPrograms : courses;
    if (list.length > 0) {
      setSelectedProgramId(list[0].id);
      setTitle(`${list[0].title} — Weekend Live Masterclass`);
    } else {
      setSelectedProgramId('');
    }
  };

  // Thumbnail File Upload & Compression
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressing(true);
      setErrorMsg('');
      const res = await compressThumbnail(file, { maxWidth: 1280, maxHeight: 720, quality: 0.85 });
      setThumbnail(res.dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compress thumbnail image');
    } finally {
      setCompressing(false);
    }
  };

  // Submit Handler: Mode 'scheduled' or 'live'
  const handleSubmit = async (mode: 'scheduled' | 'live') => {
    setErrorMsg('');
    const list = targetType === 'internship' ? trainingPrograms : courses;
    const selectedProgram = list.find((p) => p.id === selectedProgramId);

    if (!selectedProgram) {
      setErrorMsg('Please select a valid Course or Internship program.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a live class title.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/live/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          courseTitle: selectedProgram.title,
          courseId: selectedProgram.id,
          targetType,
          thumbnail,
          instructorName: instructorName || 'Binary Vidya Lead Faculty',
          instructorEmail,
          description: description.trim() || 'Interactive weekend live cohort session with live code demonstration and Q&A.',
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
          status: mode,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save live session');
      }

      onSaved(data.session);
      onClose();

      // If user chose "Go Live Immediately", open classroom in a new tab
      if (mode === 'live' && data.session?.meetingId) {
        window.open(`/live/${data.session.meetingId}`, '_blank');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating live session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentProgramList = targetType === 'internship' ? trainingPrograms : courses;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Radio size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Schedule Live Class / Go Live Studio
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Host: {instructorName} ({instructorEmail})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* 1. Target Program Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Target Program Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('internship')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: targetType === 'internship' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: targetType === 'internship' ? '#eff6ff' : '#f8fafc',
                  color: targetType === 'internship' ? '#1d4ed8' : '#64748b',
                }}
              >
                <GraduationCap size={16} />
                <span>Training &amp; Internship</span>
              </button>

              <button
                type="button"
                onClick={() => handleTargetTypeChange('course')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: targetType === 'course' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: targetType === 'course' ? '#eff6ff' : '#f8fafc',
                  color: targetType === 'course' ? '#1d4ed8' : '#64748b',
                }}
              >
                <BookOpen size={16} />
                <span>Technical Course</span>
              </button>
            </div>
          </div>

          {/* 2. Select Specific Course / Internship */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select {targetType === 'internship' ? 'Internship Cohort' : 'Course'} *
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              {currentProgramList.length === 0 ? (
                <option value="">No programs available</option>
              ) : (
                currentProgramList.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Live Title */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Live Class Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React 19, Component Architecture & WebRTC Deep Dive"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* 4. Thumbnail Upload / Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Live Session Thumbnail
            </label>
            {thumbnail ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '160px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={thumbnail}
                  alt="Thumbnail Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setThumbnail('')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleThumbnailUpload}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {compressing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#2563eb' }}>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Optimizing thumbnail...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        Click to upload live masterclass banner
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                        Supports PNG, JPG, WebP (auto-compressed for fast loading)
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. Schedule Date & Time */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Scheduled Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* 6. Description / Agenda */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Session Description &amp; Agenda
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline topics, live code demonstrations, and Q&A agenda for your students..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              disabled={submitting || compressing}
              onClick={() => handleSubmit('scheduled')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Calendar size={15} color="#2563eb" />
              <span>Schedule for Later</span>
            </button>

            <button
              type="button"
              disabled={submitting || compressing}
              onClick={() => handleSubmit('live')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Radio size={16} />
                  <span>Go Live Now (Launch Studio)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}