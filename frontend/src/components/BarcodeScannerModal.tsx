import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, X, ShieldCheck, AlertCircle } from 'lucide-react';

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
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);

  // Stop camera tracks cleanly
  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop();
        }
        await qrCodeInstanceRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        qrCodeInstanceRef.current = null;
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const startCameraScanner = async () => {
    setError('');
    setHasConsented(true);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && hasConsented) {
      let qrScanner: Html5Qrcode | null = null;
      let isMounted = true;

      const initScanner = async () => {
        try {
          qrScanner = new Html5Qrcode('barcode-reader-view');
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
              // Frame scan failure ignored
            }
          );
        } catch (err: any) {
          if (isMounted) {
            console.error('Camera start error:', err);
            setError(
              err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')
                ? 'Camera access was denied. Please allow camera permissions in browser settings or use manual barcode entry below.'
                : 'Unable to start camera. Please enter barcode manually below.'
            );
          }
        }
      };

      // Slight timeout to ensure #barcode-reader-view is in DOM
      const timer = setTimeout(initScanner, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (qrScanner && qrScanner.isScanning) {
          qrScanner.stop().catch(() => {}).finally(() => {
            try {
              qrScanner?.clear();
            } catch {
              // Ignore
            }
          });
        }
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) {
      setError('Please enter a valid barcode number');
      return;
    }
    stopScanner().then(() => {
      onScanSuccess(manualBarcode.trim());
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl border border-[#E5E9E6] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#635BFF]">
              <Camera className="w-5 h-5 text-[#635BFF]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#17172B]">Product Scanner</h3>
              <span className="text-[10px] font-bold text-[#64748B]">Privacy-First Local Barcode Decoder</span>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-[#64748B] hover:bg-[#F8F9FD] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E2E8F0] bg-[#F8F9FD]">
          <button
            onClick={() => { setActiveTab('camera'); setError(''); }}
            className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'camera' ? 'border-b-2 border-[#635BFF] text-[#635BFF] bg-white' : 'text-[#64748B]'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera Scanner
          </button>
          <button
            onClick={() => { 
              setActiveTab('manual'); 
              stopScanner();
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'manual' ? 'border-b-2 border-[#635BFF] text-[#635BFF] bg-white' : 'text-[#64748B]'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Enter Barcode
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'camera' ? (
            <div className="space-y-4">
              
              {!hasConsented ? (
                /* Privacy Explanation Card prior to requesting camera */
                <div className="card-fresh p-5 space-y-4 text-center border border-[#E2E8F0]">
                  <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-[#17172B]">Privacy-First Camera Access</h4>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      FoodLens decodes barcodes locally in your browser. No photos, video streams, or camera frames are uploaded or saved to any cloud server.
                    </p>
                  </div>
                  <button
                    onClick={startCameraScanner}
                    className="w-full py-3.5 rounded-[16px] font-black text-xs bg-[#635BFF] text-white hover:bg-[#4E44E6] transition-all shadow-md shadow-[#635BFF]/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    Allow Camera & Scan
                  </button>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="text-xs font-bold text-[#64748B] hover:text-[#17172B] underline block mx-auto cursor-pointer"
                  >
                    Or enter barcode number manually
                  </button>
                </div>
              ) : (
                /* Active Viewfinder */
                <div className="space-y-3">
                  <p className="text-xs text-[#64748B] text-center font-semibold">
                    Center the food packaging barcode within the viewfinder
                  </p>
                  <div 
                    id="barcode-reader-view" 
                    className="w-full rounded-[20px] overflow-hidden border border-[#E2E8F0] bg-black min-h-[260px]"
                  ></div>
                  <p className="text-[10px] text-center text-[#64748B] font-bold">
                    🔒 Video stream is processed exclusively in browser memory.
                  </p>
                </div>
              )}

            </div>
          ) : (
            /* Manual Barcode Input Form */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#17172B] mb-2 uppercase tracking-wider">
                  Product Barcode (EAN-13 / UPC / GTIN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8901058852387 or jolo"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FD] border border-[#E2E8F0] text-[#17172B] font-mono text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#635BFF]"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-[14px] bg-[#EEF2FF] border border-[#635BFF]/20 text-[11px] text-[#635BFF] font-semibold space-y-1">
                <span>💡 Tip: Regional items like Jolo Chips or unlisted kirana snacks can be looked up directly by entering their name or barcode!</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-[16px] font-black bg-[#635BFF] text-white hover:bg-[#4E44E6] transition-all text-xs shadow-md shadow-[#635BFF]/30 cursor-pointer"
              >
                Lookup Barcode
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
