'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useScanQr } from "@/components/api/client";
import { ArrowLeft, Camera, RefreshCw, CheckCircle2, AlertTriangle, Send, Video } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/components/auth-provider';
import jsQR from 'jsqr';

export default function StudentScanPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const scanMutation = useScanQr();

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.replace('/student/login');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    // Camera state management
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [cameraErrorMessage, setCameraErrorMessage] = useState<string>('');
    const [manualToken, setManualToken] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Scan status overlays
    const [scanResult, setScanResult] = useState<{ status: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    if (isAuthLoading || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center text-white text-xs font-semibold">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#004B29] border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying authentication...</span>
                </div>
            </div>
        );
    }

    const [isVideoReady, setIsVideoReady] = useState(false);
    const lastScanTimeRef = useRef<number>(0);

    // Helper: Stop active camera tracks cleanly and wait 500ms before reopening
    const stopActiveStream = async () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
            videoRef.current.load();
        }
        setIsVideoReady(false);
        // Wait 500 ms delay before reopening another camera (prevents Iriun/DroidCam driver locks)
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    // Auto-resume scanner if camera permission changes dynamically
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
            let permissionStatus: PermissionStatus | null = null;
            navigator.permissions.query({ name: 'camera' as any }).then((status) => {
                permissionStatus = status;
                status.onchange = () => {
                    if (status.state === 'granted') {
                        setCameraErrorMessage('');
                        setHasCameraPermission(null); // Triggers re-init
                    }
                };
            }).catch(() => {});

            return () => {
                if (permissionStatus) {
                    permissionStatus.onchange = null;
                }
            };
        }
    }, []);

    // Listen to devicechange event to refresh camera device list dynamically
    useEffect(() => {
        const handleDeviceChange = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                try {
                    const allDevices = await navigator.mediaDevices.enumerateDevices();
                    const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
                    setDevices(videoInputs);
                } catch {
                    // Ignore enumeration errors during change
                }
            }
        };

        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
            navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        }

        return () => {
            if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            }
        };
    }, []);

    // 1. Initialize camera & enumerate available video devices (Supports Integrated, USB, Iriun, DroidCam, OBS Virtual Cameras)
    useEffect(() => {
        // Check HTTPS / Localhost secure context restrictions
        const isSecure = typeof window !== 'undefined' && (
            window.isSecureContext ||
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
        );

        if (!isSecure) {
            setHasCameraPermission(false);
            setCameraErrorMessage("Camera access requires a secure connection (HTTPS or localhost). Please switch to HTTPS or localhost.");
            return;
        }

        // Check if browser supports mediaDevices
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCameraPermission(false);
            setCameraErrorMessage("Your browser does not support camera access.");
            return;
        }

        let isMounted = true;

        async function initCamera() {
            try {
                await stopActiveStream();

                // Restore previously saved camera from localStorage if available
                const savedDeviceId = typeof window !== 'undefined' ? localStorage.getItem('preferred_camera_device_id') : null;
                const targetDeviceId = selectedDeviceId || savedDeviceId || '';

                // Build 1280x720 30FPS camera constraints (Optimal for Iriun Webcam & DroidCam virtual feeds)
                const videoConstraints: MediaTrackConstraints = targetDeviceId
                    ? {
                        deviceId: { exact: targetDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    }
                    : {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    };

                const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
                
                if (!isMounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;
                const video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.onloadedmetadata = async () => {
                        try {
                            await video.play();
                            if (isMounted) setIsVideoReady(true);
                        } catch {
                            if (isMounted) setIsVideoReady(true);
                        }
                    };
                }
                setHasCameraPermission(true);
                setCameraErrorMessage('');

                // Enumerate available video devices (Populates Integrated, USB, Iriun, DroidCam, OBS Virtual Webcams)
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
                
                setDevices(videoInputs);

                // Auto-set selected device and persist to localStorage
                const activeTrack = stream.getVideoTracks()[0];
                const activeDeviceId = activeTrack?.getSettings()?.deviceId || (videoInputs[0]?.deviceId || '');
                
                if (activeDeviceId && activeDeviceId !== selectedDeviceId) {
                    setSelectedDeviceId(activeDeviceId);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('preferred_camera_device_id', activeDeviceId);
                    }
                }

            } catch (err: any) {
                if (!isMounted) return;
                await stopActiveStream();
                setHasCameraPermission(false);

                const errName = err.name || '';
                if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
                    setCameraErrorMessage("Camera permission denied. Please allow camera access.");
                    showToast("Camera permission denied. Please allow camera access.", "error");
                } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                    setCameraErrorMessage("No camera detected.");
                    showToast("No camera detected.", "error");
                } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
                    setCameraErrorMessage("The selected camera is currently in use or initializing.");
                    showToast("The selected camera is currently in use.", "error");
                } else {
                    setCameraErrorMessage("Could not access camera. You can verify attendance using manual token entry below.");
                    showToast("Could not access camera. Please paste your token manually below.", "info");
                }
            }
        }

        initCamera();

        // Release stream on page unload
        const handleBeforeUnload = () => { stopActiveStream(); };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            isMounted = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            stopActiveStream();
        };
    }, [selectedDeviceId]);

    // 2. Real-time 640x480 downscaled canvas scanning loop (Throttled every 120ms for optimal Iriun/DroidCam performance)
    useEffect(() => {
        let active = true;
        let animationFrameId: number;

        const scanFrame = () => {
            if (!active) return;
            
            // Pause scanning during submission or modal overlay
            if (isSubmitting || scanResult) {
                animationFrameId = requestAnimationFrame(scanFrame);
                return;
            }

            const now = Date.now();
            const video = videoRef.current;

            // Throttle scanning to every 120ms to prevent CPU overload on high-res virtual webcam streams
            if (now - lastScanTimeRef.current >= 120) {
                lastScanTimeRef.current = now;

                if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
                    if (!canvasRef.current) {
                        canvasRef.current = document.createElement("canvas");
                    }
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        // Downscale HD stream to 640x480 canvas for fast jsQR decoding
                        canvas.width = 640;
                        canvas.height = 480;
                        ctx.drawImage(video, 0, 0, 640, 480);
                        
                        const imageData = ctx.getImageData(0, 0, 640, 480);
                        const code = jsQR(imageData.data, 640, 480, {
                            inversionAttempts: "dontInvert",
                        });
                        
                        if (code && code.data) {
                            handleSubmitScan(code.data);
                        }
                    }
                }
            }

            animationFrameId = requestAnimationFrame(scanFrame);
        };

        if (hasCameraPermission === true && isVideoReady === true) {
            animationFrameId = requestAnimationFrame(scanFrame);
        }

        return () => {
            active = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, [hasCameraPermission, isVideoReady, isSubmitting, scanResult]);

    const handleSubmitScan = async (tokenString: string) => {
        if (!tokenString.trim()) {
            showToast("Please enter or scan a valid QR Code token.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await scanMutation.mutateAsync({
                token: tokenString.trim(),
            });

            setScanResult({
                status: 'SUCCESS',
                message: res.message || "Attendance check-in verified successfully!"
            });
            showToast(res.message || "Attendance verified successfully!");

        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Verification failed. Please scan again.";
            setScanResult({
                status: 'ERROR',
                message: errorMsg
            });
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center">
            
            {/* Header */}
            <div className="w-full bg-[#004B29] py-4 px-6 flex items-center justify-between max-w-lg shadow-md">
                <button 
                    onClick={() => router.push('/student/dashboard')} 
                    className="flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white cursor-pointer"
                >
                    <ArrowLeft size={16} /> BACK
                </button>
                <span className="text-xs font-bold uppercase tracking-wider">CLASSROOM QR SCANNER</span>
                <div className="w-10"></div>
            </div>

            {/* Viewfinder Area */}
            <div className="w-full max-w-lg grow flex flex-col justify-center items-center relative bg-neutral-950 p-4">
                
                {/* Camera Selector Dropdown (Populates Integrated, USB, Iriun Webcam, etc.) */}
                {devices.length > 0 && (
                    <div className="w-full max-w-xs mb-4 flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
                        <Video size={16} className="text-[#004B29] shrink-0" />
                        <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="bg-transparent text-xs text-neutral-200 font-semibold focus:outline-none w-full cursor-pointer"
                        >
                            {devices.map((device, idx) => (
                                <option key={device.deviceId || idx} value={device.deviceId} className="bg-neutral-900 text-neutral-200">
                                    {device.label || `Camera ${idx + 1} (${device.deviceId.slice(0, 6)}...)`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Viewfinder frame */}
                <div className="relative w-72 h-72 border-4 border-[#004B29] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-black">
                    {hasCameraPermission === true ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover" 
                        />
                    ) : hasCameraPermission === false ? (
                        <div className="p-6 text-center text-xs text-neutral-400 font-semibold flex flex-col items-center gap-2">
                            <Camera size={32} className="text-red-500/80" />
                            <span className="text-red-400 font-bold max-w-[200px] leading-relaxed">
                                {cameraErrorMessage || "No camera detected."}
                            </span>
                            <span className="text-[10px] text-neutral-500 mt-1">
                                Paste your classroom token below.
                            </span>
                        </div>
                    ) : (
                        <div className="text-xs text-neutral-500 flex flex-col items-center gap-2">
                            <RefreshCw className="animate-spin text-[#004B29]" size={24} />
                            Initializing camera viewfinder...
                        </div>
                    )}

                    {/* Scanning overlay laser line effect */}
                    {hasCameraPermission && !isSubmitting && !scanResult && (
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500 animate-bounce shadow-[0_0_15px_#22c55e]" style={{ animationDuration: '2.5s' }}></div>
                    )}
                </div>

                <p className="text-xs text-neutral-400 font-semibold text-center mt-5 max-w-xs leading-relaxed">
                    Point your camera at the lecture session QR Code projected on the class screen, or paste the session token below.
                </p>

                {/* Manual token input drawer */}
                <div className="w-full max-w-xs mt-6 bg-neutral-900 border border-neutral-850 rounded-xl p-4 flex flex-col gap-3">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Manual Session Token Verification</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Paste token or code here..."
                            className="grow bg-black border border-neutral-800 text-xs px-3 py-2 rounded text-neutral-200 focus:outline-none focus:border-[#004B29]"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                        />
                        <button
                            onClick={() => handleSubmitScan(manualToken)}
                            disabled={isSubmitting || !manualToken.trim()}
                            className="bg-[#004B29] hover:bg-opacity-90 disabled:opacity-50 text-white p-2 rounded cursor-pointer transition flex items-center justify-center shrink-0"
                            title="Submit Token"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Instant Success / Failure Overlays */}
            {scanResult && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center p-6 animate__animated animate__fadeIn">
                    
                    <div className="w-full max-w-sm bg-neutral-900 border border-neutral-850 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
                        {scanResult.status === 'SUCCESS' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4 animate__animated animate__zoomIn">
                                    <CheckCircle2 size={36} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Check-in Verified</h3>
                                <p className="text-xs text-neutral-400 font-semibold mb-6 leading-relaxed">
                                    {scanResult.message}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 animate__animated animate__shakeX">
                                    <AlertTriangle size={36} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Check-in Rejected</h3>
                                <p className="text-xs text-neutral-400 font-semibold mb-6 leading-relaxed">
                                    {scanResult.message}
                                </p>
                            </>
                        )}

                        <button
                            onClick={() => {
                                setScanResult(null);
                                router.push('/student/dashboard');
                            }}
                            className="w-full bg-[#004B29] text-white py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-opacity-95 transition cursor-pointer"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

