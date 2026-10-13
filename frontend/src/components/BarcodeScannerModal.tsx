import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, X, ShieldCheck, AlertCircle, Check, Sparkles, RefreshCw } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // Quick test sample barcodes from verified database
  const sampleBarcodes = [
    { code: '8901058852387', label: 'Maggi 2-Min Noodles' },
    { code: '8901491101837', label: 'Quaker Oats' },
    { code: '8901030383427', label: 'Kissan Fruit Jam' },
    { code: '8901063142077', label: 'Britannia Good Day' },
    { code: 'jolo', label: 'Jolo Chips' }
  ];

  // Stop camera tracks cleanly and safely
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    const scanner = qrCodeInstanceRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      try {
        const el = document.getElementById('barcode-reader-view');
        if (el) {
          await scanner.clear();
        }
      } catch (err) {
        // Safe ignore
      }
      qrCodeInstanceRef.current = null;
    }
    setIsCameraActive(false);
    isStoppingRef.current = false;
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleSwitchTab = async (tab: 'camera' | 'manual') => {
    setError('');
    if (tab === 'manual') {
      await stopScanner();
      setActiveTab('manual');
      setTimeout(() => manualInputRef.current?.focus(), 100);
    } else {
      setActiveTab('camera');
    }
  };

  const startCameraScanner = () => {
    setError('');
    setHasConsented(true);
  };

  // Capture current video frame and attempt single-frame scan
  const handleCaptureFrame = async () => {
    setError('');
    setIsCapturing(true);

    const container = document.getElementById('barcode-reader-view');
    const video = container?.querySelector('video');

    if (!video || video.videoWidth === 0) {
      setIsCapturing(false);
      setError('Camera video is still starting up. Please hold steady in good lighting.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsCapturing(false);
            return;
          }
          const file = new File([blob], 'barcode_snapshot.png', { type: 'image/png' });
          try {
            // Run single frame file decode
            const fileScanner = new Html5Qrcode('barcode-temp-buffer', false);
            const decoded = await fileScanner.scanFile(file, false);
            fileScanner.clear();
            if (decoded && decoded.trim()) {
              await stopScanner();
              onScanSuccess(decoded.trim());
              return;
            }
          } catch (err) {
            setError('Could not read barcode in this snapshot. Please center the barcode lines directly inside the green box or enter numbers below.');
          } finally {
            setIsCapturing(false);
          }
        }, 'image/png');
      }
    } catch (err) {
      setIsCapturing(false);
      setError('Snapshot failed. Please try again or type the barcode manually.');
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && hasConsented) {
      let isMounted = true;

      const initScanner = async () => {
        try {
          // If already running, don't duplicate
          if (qrCodeInstanceRef.current?.isScanning) return;

          const qrScanner = new Html5Qrcode('barcode-reader-view');
          qrCodeInstanceRef.current = qrScanner;

          const config = {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333333
          };

          await qrScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (isMounted) {
                stopScanner().then(() => {
                  onScanSuccess(decodedText.trim());
                });
              }
            },
            () => {
              // Frame decode tick (continuous auto-detect)
            }
          );

          if (isMounted) {
            setIsCameraActive(true);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Camera start error:', err);
            setError(
              err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')
                ? 'Camera access was denied. Please allow camera permissions in browser settings or enter barcode manually below.'
                : 'Unable to start camera. Please enter barcode numbers manually below.'
            );
          }
        }
      };

      const timer = setTimeout(initScanner, 120);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen, activeTab, hasConsented]);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setHasConsented(false);
      setError('');
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) {
      setError('Please enter a valid product barcode or product name');
      return;
    }
    await stopScanner();
    onScanSuccess(manualBarcode.trim());
  };

  const handleSelectSample = async (code: string) => {
    setManualBarcode(code);
    setError('');
    await stopScanner();
    onScanSuccess(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-[24px] overflow-hidden shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[92vh]">
        
        {/* Hidden buffer div for snapshot decoding */}
        <div id="barcode-temp-buffer" className="hidden"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E8F0] bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <Camera className="w-5 h-5 text-[#B9F24A]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18181B]">Product Scanner</h3>
              <span className="text-[10px] font-bold text-[#64748B]">Scan Barcode or Type Manually</span>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E2E8F0] bg-slate-50 shrink-0">
          <button
            onClick={() => handleSwitchTab('camera')}
            className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera' 
                ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" /> Live Camera Scanner
          </button>
          <button
            onClick={() => handleSwitchTab('manual')}
            className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual' 
                ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Keyboard className="w-4 h-4 text-slate-700" /> Enter Barcode Manually
          </button>
        </div>

        {/* Modal Body (Scrollable for mobile screens) */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {activeTab === 'camera' && (
                  <button
                    onClick={() => handleSwitchTab('manual')}
                    className="block mt-1.5 underline text-[11px] font-black text-[#EF4444] cursor-pointer"
                  >
                    Switch to manual barcode entry →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CAMERA VIEWPORT (Kept in DOM so stop/clear NEVER throw unmount errors)      */}
          {/* ========================================================================= */}
          <div className={activeTab === 'camera' ? 'space-y-4' : 'hidden'}>
            
            {!hasConsented ? (
              /* Privacy Explanation Prior to Requesting Camera */
              <div className="card-fresh p-5 sm:p-6 space-y-4 text-center border border-[#E2E8F0] bg-white">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-[#18181B]">Privacy-First Camera Access</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    FoodLens decodes barcodes locally in your device's browser memory. No camera frames, videos, or photos are uploaded to any remote server.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={startCameraScanner}
                    className="w-full py-3.5 rounded-[16px] font-black text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-[#B9F24A]" />
                    Allow Camera & Open Viewfinder
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('manual')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 underline block mx-auto pt-1 cursor-pointer"
                  >
                    Or enter barcode digits directly
                  </button>
                </div>
              </div>
            ) : (
              /* Active Viewfinder */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span>Align barcode inside the box</span>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Detecting
                  </span>
                </div>

                {/* Viewfinder container element */}
                <div className="relative rounded-[20px] overflow-hidden border-2 border-slate-900 bg-black shadow-inner">
                  <div 
                    id="barcode-reader-view" 
                    className="w-full min-h-[260px] flex items-center justify-center text-slate-400"
                  ></div>

                  {/* Corner Target Accents */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl pointer-events-none"></div>
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr pointer-events-none"></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl pointer-events-none"></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br pointer-events-none"></div>
                </div>

                {/* Shutter / Capture & Done Action Buttons (Addresses "no option for clicking or done") */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={isCapturing || !isCameraActive}
                    className="w-full sm:flex-1 py-3.5 rounded-[16px] font-black text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isCapturing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Analyzing Frame...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-emerald-200" />
                        <span>📸 Click to Capture / Scan Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTab('manual')}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-[16px] font-black text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Keyboard className="w-4 h-4 text-slate-600" />
                    <span>Enter Manually</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                  <span>Auto-detects continuous barcode frames</span>
                  <button
                    onClick={handleClose}
                    className="font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Cancel / Done
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* MANUAL BARCODE INPUT VIEW                                                 */}
          {/* ========================================================================= */}
          <div className={activeTab === 'manual' ? 'space-y-4' : 'hidden'}>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#18181B] mb-2 uppercase tracking-wider">
                  Product Barcode or Item Name
                </label>
                <div className="relative">
                  <input
                    ref={manualInputRef}
                    type="text"
                    placeholder="e.g. 8901058852387 or jolo"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 rounded-[16px] bg-slate-50 border border-[#E2E8F0] text-[#18181B] font-mono font-bold text-base placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                  {manualBarcode && (
                    <button
                      type="button"
                      onClick={() => setManualBarcode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Enter 8, 12, or 13 digit EAN/UPC barcode number, or search a product name.
                </p>
              </div>

              {/* Quick Sample Barcode Chips */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Test Barcodes (Click to test instantly):
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleBarcodes.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectSample(item.code)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] text-slate-400">({item.code})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: "✓ Done / Lookup" & "Back to Camera" */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-3.5 rounded-[16px] font-black bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-[#B9F24A]" />
                  <span>✓ Done / Lookup Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchTab('camera')}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-[16px] font-black text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Open Camera</span>
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between text-xs text-slate-500 px-6 shrink-0">
          <span>FoodLens Local Scanner</span>
          <button
            onClick={handleClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close ✕
          </button>
        </div>

      </div>
    </div>
  );
};
