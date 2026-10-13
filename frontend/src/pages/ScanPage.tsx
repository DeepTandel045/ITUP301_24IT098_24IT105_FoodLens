import React, { useState } from 'react';
import { scanService } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { 
  Upload, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  X,
  Scan,
  HelpCircle,
  Keyboard,
  Camera
} from 'lucide-react';

interface ScanPageProps {
  onNavigate: (tab: string, data?: any) => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({ onNavigate }) => {
  const [activeScanMode, setActiveScanMode] = useState<'barcode' | 'label' | 'upload' | 'manual'>('barcode');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBarcodeSuccess = async (barcode: string) => {
    setIsScannerOpen(false);
    setLoading(true);
    setError('');
    try {
      const scanRes = await scanService.scanBarcode(barcode);
      onNavigate('product_details', scanRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Barcode '${barcode}' not found in database. Switch to 'Scan Label' mode below to decode via AI OCR!`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleBarcodeSuccess(manualBarcode.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleOcrSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const scanRes = await scanService.scanLabelImage(selectedFile);
      onNavigate('product_details', scanRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'OCR label processing failed. Please upload a clear photo of the ingredient list or nutrition table.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Scanner Navigation Header (Section 4 spec: ← Scan Food ... ✕) */}
      <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-[#18181B] cursor-pointer"
        >
          ← Scan Food
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-[#64748B]">
          Camera Intelligence
        </span>
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-1.5 rounded-full hover:bg-slate-100 text-[#64748B] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="card-coral p-4 flex items-center justify-between text-xs font-bold text-[#EF4444]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setActiveScanMode('label')}
            className="px-3 py-1 bg-slate-900 text-white rounded-full text-[11px] font-extrabold cursor-pointer active:scale-95"
          >
            Try Label OCR
          </button>
        </div>
      )}

      {loading && (
        <div className="card-fresh p-8 text-center space-y-4 shadow-lg border-2 border-emerald-500">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-base font-black text-[#18181B]">Analyzing Product Ingredients & Nutrition...</h3>
          <p className="text-xs text-[#64748B] font-semibold">Running OpenCV preprocessing & deterministic suitability scoring engine</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMERA VIEWPORT CONTAINER (Section 4 mock UI: "Feels like a camera app")    */}
      {/* ========================================================================= */}
      <div className="relative rounded-[28px] overflow-hidden bg-slate-950 text-white p-6 sm:p-10 shadow-2xl space-y-6 flex flex-col items-center justify-between min-h-[420px]">
        
        {/* Top Status */}
        <div className="w-full flex items-center justify-between text-xs text-slate-300 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-[#DDF3E7]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> CAMERA LIVE
          </span>
          <span className="uppercase font-bold tracking-wider">{activeScanMode} mode</span>
        </div>

        {/* Viewfinder Target Frame */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-emerald-400/50 rounded-2xl flex flex-col items-center justify-center p-4 camera-frame-pulse">
          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

          {activeScanMode === 'barcode' && (
            <div className="text-center space-y-3">
              <Scan className="w-12 h-12 mx-auto text-emerald-400" />
              <p className="text-xs font-bold text-slate-200">
                Align barcode here
              </p>
            </div>
          )}

          {activeScanMode === 'label' && (
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 mx-auto text-teal-300" />
              <p className="text-xs font-bold text-slate-200">
                Align nutrition label or ingredients
              </p>
            </div>
          )}

          {activeScanMode === 'upload' && (
            <div className="text-center space-y-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Label preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-emerald-400" />
                  <p className="text-xs font-bold text-slate-200">
                    Upload food label image
                  </p>
                </>
              )}
            </div>
          )}

          {activeScanMode === 'manual' && (
            <div className="text-center space-y-3 w-full px-2">
              <Keyboard className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-xs font-bold text-slate-200">Enter Barcode Digits</p>
            </div>
          )}
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center justify-center gap-3 w-full">
          {activeScanMode === 'barcode' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg ring-4 ring-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Start Live Camera Scanner"
              >
                <Camera className="w-5 h-5 text-slate-950" />
                <span>📸 Click to Open Live Camera</span>
              </button>

              <button
                onClick={() => setActiveScanMode('manual')}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Keyboard className="w-4 h-4 text-slate-300" />
                <span>Enter Barcode Manually</span>
              </button>
            </div>
          )}

          {activeScanMode === 'upload' && (
            <label htmlFor="label-upload-camera" className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg active:scale-95 transition-transform flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-950" />
              <span>Choose / Take Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="label-upload-camera"
              />
            </label>
          )}

          {activeScanMode === 'label' && (
            <label htmlFor="label-upload-direct" className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg active:scale-95 transition-transform flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Take / Upload Nutrition Label</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="label-upload-direct"
              />
            </label>
          )}
        </div>

        {/* Mode Switcher Tabs (Barcode | Label | Upload | Manual) */}
        <div className="w-full flex justify-center gap-2 pt-2 border-t border-slate-800 text-xs font-extrabold flex-wrap">
          <button
            onClick={() => setActiveScanMode('barcode')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeScanMode === 'barcode' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Barcode
          </button>

          <button
            onClick={() => setActiveScanMode('label')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeScanMode === 'label' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Label (OCR)
          </button>

          <button
            onClick={() => setActiveScanMode('upload')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeScanMode === 'upload' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload
          </button>

          <button
            onClick={() => setActiveScanMode('manual')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              activeScanMode === 'manual' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>

      </div>

      {/* Manual Input Form Panel if Mode is Manual */}
      {activeScanMode === 'manual' && (
        <div className="card-fresh p-6 space-y-4 bg-white border border-[#E2E8F0]">
          <div>
            <h3 className="text-sm font-black text-[#18181B] uppercase tracking-wider">
              Enter Barcode Number or Product Name
            </h3>
            <p className="text-xs text-[#64748B]">
              Type product digits directly to retrieve instant nutrition suitability scores.
            </p>
          </div>

          <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Type barcode e.g. 8901058852387 or 'jolo'"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-sm font-mono font-bold text-[#18181B] focus:outline-none focus:border-slate-800"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>✓ Done / Lookup Product</span>
            </button>
          </form>

          {/* Quick Test Sample Barcode Chips */}
          <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Quick Test Samples (Tap to look up immediately):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { code: '8901058852387', name: 'Maggi Noodles' },
                { code: '8901491101837', name: 'Quaker Oats' },
                { code: '8901030383427', name: 'Kissan Fruit Jam' },
                { code: '8901063142077', name: 'Britannia Good Day' },
                { code: 'jolo', name: 'Jolo Chips' }
              ].map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => handleBarcodeSuccess(s.code)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>{s.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({s.code})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Label Upload Submission Button if file selected */}
      {(activeScanMode === 'upload' || activeScanMode === 'label') && selectedFile && (
        <div className="card-fresh p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#E2E8F0]">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-800 block">
              Photo Selected: {selectedFile.name}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Ready to extract text and decode ingredients via OpenCV OCR
            </span>
          </div>
          <button
            onClick={handleOcrSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-black bg-slate-900 text-white text-xs hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <span>✓ Done / Analyze via AI OCR</span>
            <ArrowRight className="w-4 h-4 text-[#B9F24A]" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CRITICAL UX FEATURE CALLOUT UNDERNEATH (Section 4 spec)                    */}
      {/* ========================================================================= */}
      <div className="card-mint p-6 flex items-start gap-4 shadow-sm border border-[#164B3A]/20">
        <div className="w-10 h-10 rounded-2xl bg-[#164B3A] text-[#DDF3E7] flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#164B3A]">
            Can't find the product barcode?
          </h4>
          <p className="text-xs text-[#17201C] leading-relaxed font-semibold">
            Scan the nutrition label instead. That's a key FoodLens feature because our barcode → OCR fallback engine handles custom, local, and repackaged items seamlessly.
          </p>
          <button
            onClick={() => setActiveScanMode('upload')}
            className="mt-2 text-xs font-extrabold text-[#164B3A] underline inline-block"
          >
            Switch to Label Photo Upload →
          </button>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeSuccess}
      />

    </div>
  );
};
