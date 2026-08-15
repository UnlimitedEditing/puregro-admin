import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Check, Trash2, SwitchCamera, AlertCircle } from 'lucide-react';

export default function CameraCapture({ onPhotoCaptured, initialPhoto = null }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [capturedImage, setCapturedImage] = useState(initialPhoto);
  const [cameraError, setCameraError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera
  const startCamera = async (facing = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload a photo file.');
      setIsCameraActive(false);
    }
  };

  // Toggle front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Snap photo
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Center crop square
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 480, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    setCapturedImage(dataUrl);
    stopCameraStream();
    setIsCameraActive(false);
    if (onPhotoCaptured) {
      onPhotoCaptured(dataUrl);
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      if (onPhotoCaptured) {
        onPhotoCaptured(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (onPhotoCaptured) onPhotoCaptured(null);
    startCamera(facingMode);
  };

  const handleClear = () => {
    setCapturedImage(null);
    stopCameraStream();
    setIsCameraActive(false);
    if (onPhotoCaptured) onPhotoCaptured(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Viewport / Frame */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/40 bg-slate-900/80 flex items-center justify-center shadow-inner group">
        {capturedImage ? (
          // Captured Image Preview
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Member Portrait"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
              <Check className="w-4 h-4" />
            </div>
          </div>
        ) : isCameraActive ? (
          // Live Video Stream
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Overlay */}
            <div className="absolute inset-4 border border-emerald-400/50 rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-[11px] bg-black/60 backdrop-blur-sm text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                Align face in circle
              </span>
            </div>
          </div>
        ) : (
          // Placeholder
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <div className="w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center mb-2 text-emerald-400">
              <Camera className="w-7 h-7" />
            </div>
            <p className="text-xs font-medium text-slate-300">Member Photo</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Take photo or upload</p>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {cameraError && (
        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 max-w-xs text-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {capturedImage ? (
          <>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-medium text-rose-300 flex items-center gap-1 border border-rose-800/40 transition"
              title="Remove Photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isCameraActive ? (
          <>
            <button
              type="button"
              onClick={takeSnapshot}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition transform active:scale-95"
            >
              <Camera className="w-4 h-4" /> Capture Snapshot
            </button>
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Switch Front/Back Camera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setIsCameraActive(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition"
            >
              <Camera className="w-3.5 h-3.5" /> Take Photo
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700/80 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
          </>
        )}
      </div>
    </div>
  );
}
