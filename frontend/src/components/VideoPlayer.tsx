'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Check,
  Zap,
} from 'lucide-react';

interface VideoPlayerProps {
  src?: string;
  title?: string;
  poster?: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = ['Auto (1080p)', '1080p HD', '720p HD', '480p SD', '360p'];

// High quality reliable technical demonstration stream for placeholder/demo videos
const DEFAULT_FALLBACK_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title = 'Interactive Video Lecture',
  poster,
  onEnded,
  autoPlay = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto (1080p)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to detect YouTube URL
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(src);
  const activeVideoSrc = !youtubeId ? (src && src.trim().startsWith('http') ? src : DEFAULT_FALLBACK_VIDEO) : null;

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger brief status toast (e.g. speed or quality changed)
  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 1800);
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Fast forward / Rewind
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      duration || 99999
    );
  };

  // Volume Handlers
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      triggerToast('Muted');
    } else {
      triggerToast(`Volume ${Math.round(volume * 100)}%`);
    }
  };

  // Playback Speed
  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    triggerToast(`Speed: ${speed}x`);
  };

  // Quality Selection
  const changeQuality = (q: string) => {
    setQuality(q);
    setShowQualityMenu(false);
    triggerToast(`Quality: ${q}`);
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update time and progress
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);

    // Calculate buffered percentage
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / (videoRef.current.duration || 1)) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.volume = volume;
    if (autoPlay) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Scrubber seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Mouse activity auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showSpeedMenu && !showQualityMenu) {
          setShowControls(false);
        }
      }, 2400);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skip(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skip(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, duration]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // RENDER YOUTUBE IFRAME (If YouTube link provided)
  if (youtubeId) {
    return (
      <div className={styles.playerContainer} style={{ background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  }

  const playedPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={styles.playerContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => {
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }}
    >
      {/* Toast Notification */}
      {statusToast && <div className={styles.statusToast}>{statusToast}</div>}

      {/* Top Header Overlay with Title */}
      <div className={`${styles.headerOverlay} ${!showControls && isPlaying ? styles.controlsHidden : ''}`}>
        <h4 className={styles.lectureTitle}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(37, 99, 235, 0.6)', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
            Binary Vidya Stream
          </span>
        </div>
      </div>

      {/* Core HTML5 Video Element */}
      <video
        ref={videoRef}
        src={activeVideoSrc || undefined}
        poster={poster}
        className={styles.videoElement}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        playsInline
      />

      {/* Center Big Play Button Overlay */}
      {!isPlaying && (
        <div className={styles.centerPlayOverlay}>
          <button
            type="button"
            className={styles.bigPlayBtn}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title="Play Lecture"
          >
            <Play size={34} fill="#ffffff" style={{ marginLeft: '4px' }} />
          </button>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div
        className={`${styles.controlsWrapper} ${!showControls && isPlaying ? styles.controlsHidden : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber Progress Bar */}
        <div className={styles.progressContainer} onClick={handleSeek} title="Seek">
          <div className={styles.progressBuffered} style={{ width: `${buffered}%` }} />
          <div className={styles.progressPlayed} style={{ width: `${playedPercent}%` }}>
            <div className={styles.progressThumb} />
          </div>
        </div>

        {/* Controls Bar Row */}
        <div className={styles.controlsRow}>
          {/* Left Controls: Play/Pause, Rewind, Forward, Volume, Time */}
          <div className={styles.controlsGroupLeft}>
            {/* Play/Pause Button */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={20} fill="#ffffff" /> : <Play size={20} fill="#ffffff" />}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => skip(-10)}
              title="Rewind 10 seconds (Left Arrow)"
            >
              <RotateCcw size={18} />
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => skip(10)}
              title="Forward 10 seconds (Right Arrow)"
            >
              <RotateCw size={18} />
            </button>

            {/* Volume Control */}
            <div className={styles.volumeWrapper}>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={toggleMute}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} color="#f87171" />
                ) : volume < 0.5 ? (
                  <Volume1 size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
                title="Adjust Volume"
              />
            </div>

            {/* Time Stamp */}
            <span className={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Speed, Quality, Fullscreen */}
          <div className={styles.controlsGroupRight}>
            {/* Speed Selector Button & Popover */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.badgeBtn}
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                title="Playback Speed"
              >
                <Zap size={13} />
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className={styles.menuPopup}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, padding: '4px 8px', textTransform: 'uppercase' }}>
                    Playback Speed
                  </div>
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`${styles.menuItem} ${playbackSpeed === spd ? styles.menuItemActive : ''}`}
                      onClick={() => changeSpeed(spd)}
                    >
                      <span>{spd === 1 ? '1x (Normal)' : `${spd}x`}</span>
                      {playbackSpeed === spd && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector Button & Popover */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.badgeBtn}
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                title="Video Quality"
              >
                <Settings size={13} />
                {quality.split(' ')[0]}
              </button>

              {showQualityMenu && (
                <div className={styles.menuPopup}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, padding: '4px 8px', textTransform: 'uppercase' }}>
                    Resolution & Quality
                  </div>
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={`${styles.menuItem} ${quality === q ? styles.menuItemActive : ''}`}
                      onClick={() => changeQuality(q)}
                    >
                      <span>{q}</span>
                      {quality === q && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
