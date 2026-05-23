'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, Sparkles, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GatekeeperScannerPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scannerError, setScannerError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'reader-viewport';

  // Play synthetic audio feedback using Web Audio API
  const playAudioFeedback = (type: 'success' | 'exit' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High frequency double beep
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'exit') {
        // Medium frequency flat beep
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Low sawtooth buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('AudioContext feedback disabled by browser security policies:', e);
    }
  };

  useEffect(() => {
    // 1. Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setScannerError('No camera devices detected on this device.');
        }
      })
      .catch((err) => {
        console.error('Error fetching cameras:', err);
        setScannerError('Camera permissions denied or device occupied.');
      })
      .finally(() => {
        setCameraLoading(false);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;
    setScannerError('');
    setScanResult(null);

    // Stop active scanner if any
    if (scannerRef.current && scannerRef.current.isScanning) {
      await stopScanner();
    }

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        async (decodedText) => {
          // Scanned successfully -> VERIFY
          handleQrDecoded(decodedText);
        },
        () => {
          // Scanner frame error (ignore to prevent log spam)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setScannerError('Could not access camera feed. Verify permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Stop scanner failed:', err);
      }
    }
  };

  const handleQrDecoded = async (qrText: string) => {
    if (processing) return;
    setProcessing(true);

    // Temporarily pause scanner by stopping it (to prevent double scans)
    await stopScanner();

    try {
      const response = await fetch('/api/scanner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrText }),
      });

      const result = await response.json();

      if (result.error) {
        // API level error (unauthorized, exception, etc.)
        setScanResult({
          status: result.status || 'INVALID QR',
          error: result.error,
          studentName: result.studentName || 'Unknown Student',
        });
        playAudioFeedback('error');
      } else {
        setScanResult(result);
        if (result.status === 'VALID ENTRY') {
          playAudioFeedback('success');
        } else if (result.status === 'VALID EXIT') {
          playAudioFeedback('exit');
        } else if (result.status === 'REENTRY SUCCESS') {
          playAudioFeedback('success');
        } else {
          playAudioFeedback('error');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setScanResult({
        status: 'INVALID QR',
        error: 'Network connection error. Verification failed.',
      });
      playAudioFeedback('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    startScanner(selectedCameraId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-black text-white p-4">
      {/* Scanner Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 max-w-lg mx-auto w-full">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Scanner
        </Link>
        <span className="font-extrabold text-sm flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-brand-yellow" /> Gatekeeper Checkpoint
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
        {scanResult ? (
          /* SCAN RESULTS DISPLAY PANEL */
          <div className="w-full glass-panel border-white/10 rounded-3xl p-6 text-center space-y-6 animate-fade-in">
            {scanResult.status === 'VALID ENTRY' && (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-2xl font-black text-green-500">VALID ENTRY</h3>
                <div className="border-t border-white/5 pt-4 text-left space-y-2">
                  <p className="text-sm font-bold">Student: <span className="text-white font-black">{scanResult.studentName}</span></p>
                  <p className="text-sm font-bold">USN: <span className="text-white font-mono">{scanResult.usn}</span></p>
                  <p className="text-sm font-bold">Event: <span className="text-white">{scanResult.eventTitle}</span></p>
                </div>
              </div>
            )}

            {scanResult.status === 'VALID EXIT' && (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-brand-yellow mx-auto" />
                <h3 className="text-2xl font-black text-brand-yellow">VALID EXIT</h3>
                <div className="border-t border-white/5 pt-4 text-left space-y-2">
                  <p className="text-sm font-bold">Student: <span className="text-white font-black">{scanResult.studentName}</span></p>
                  <p className="text-sm font-bold">USN: <span className="text-white font-mono">{scanResult.usn}</span></p>
                  <p className="text-sm font-bold">Attendance: <span className="text-brand-yellow font-black">{scanResult.percent}%</span></p>
                  <p className="text-sm font-bold">Inside time: <span className="text-white">{scanResult.totalMinutes} minutes</span></p>
                </div>
              </div>
            )}

            {scanResult.status === 'REENTRY SUCCESS' && (
              <div className="space-y-4">
                <Sparkles className="w-16 h-16 text-green-400 mx-auto" />
                <h3 className="text-2xl font-black text-green-400">REENTRY SUCCESS</h3>
                <div className="border-t border-white/5 pt-4 text-left space-y-2">
                  <p className="text-sm font-bold">Student: <span className="text-white font-black">{scanResult.studentName}</span></p>
                  <p className="text-sm font-bold">USN: <span className="text-white font-mono">{scanResult.usn}</span></p>
                  <p className="text-sm font-bold">Re-entry logs: <span className="text-white">{scanResult.count} sessions</span></p>
                </div>
              </div>
            )}

            {(scanResult.status === 'REENTRY BLOCKED' || scanResult.status === 'INVALID QR') && (
              <div className="space-y-4">
                <XCircle className="w-16 h-16 text-brand-red mx-auto animate-pulse" />
                <h3 className="text-2xl font-black text-brand-red">ACCESS BLOCKED</h3>
                <div className="border-t border-white/5 pt-4 text-left space-y-2">
                  <p className="text-sm font-bold">Student: <span className="text-white font-black">{scanResult.studentName || 'Not Registered'}</span></p>
                  <p className="text-sm font-bold text-brand-red font-extrabold flex items-center gap-1.5 mt-2 bg-brand-red/10 border border-brand-red/20 p-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4" /> {scanResult.error || 'Access Denied'}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleResetScan}
              className="w-full py-4 bg-white text-black font-extrabold rounded-2xl shadow-lg hover:bg-white/95 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          /* SCANNER CAMERA VIEWFINDER */
          <div className="w-full space-y-6">
            <div className="relative aspect-square w-full max-w-[360px] mx-auto rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
              {/* html5-qrcode reader anchor */}
              <div id={qrRegionId} className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:rounded-3xl" />
              
              {/* Framing guides */}
              <div className="absolute inset-0 border-[30px] border-brand-black/40 pointer-events-none" />
              <div className="absolute inset-[30px] border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-brand-yellow rounded-xl border-dashed opacity-50 animate-pulse-slow" />
              </div>
              
              {/* Scan guiding line animation */}
              {isScanning && (
                <div className="absolute left-[30px] right-[30px] h-0.5 bg-brand-yellow/70 top-1/4 animate-bounce pointer-events-none" />
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {cameraLoading ? (
                <div className="flex justify-center py-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-yellow" />
                </div>
              ) : scannerError ? (
                <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold text-center">
                  {scannerError}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Camera */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-white/55 mb-1 text-center">Active Lens</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        if (isScanning) startScanner(e.target.value);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-xs text-white/80 font-bold"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id} className="bg-brand-black">
                          {c.label || `Camera ${cameras.indexOf(c) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trigger scanning */}
                  {isScanning ? (
                    <button
                      onClick={stopScanner}
                      className="w-full py-4 bg-brand-red/20 hover:bg-brand-red/30 border border-brand-red/35 active:scale-95 text-brand-red font-bold rounded-2xl text-xs transition-all cursor-pointer"
                    >
                      Disable Camera Feed
                    </button>
                  ) : (
                    <button
                      onClick={() => startScanner(selectedCameraId)}
                      className="w-full py-4 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-black font-extrabold rounded-2xl text-xs shadow-lg shadow-brand-yellow/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4.5 h-4.5" /> Initialize Camera Scanner
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
