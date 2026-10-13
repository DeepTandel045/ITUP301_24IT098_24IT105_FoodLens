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
  Keyboard
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

        {/* Shutter / Trigger Button (◉) */}
        <div className="flex items-center gap-4">
          {activeScanMode === 'barcode' && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-emerald-500/30 active:scale-95 transition-transform"
              title="Start Live Camera Scanner"
            >
              ◉
            </button>
          )}

          {activeScanMode === 'upload' && (
            <label htmlFor="label-upload-camera" className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="label-upload-camera"
              />
            </label>
          )}
        </div>

        {/* Mode Switcher Tabs (Barcode | Label | Upload | Manual) */}
        <div className="w-full flex justify-center gap-2 pt-2 border-t border-slate-800 text-xs font-extrabold">
          <button
            onClick={() => setActiveScanMode('barcode')}
            className={`px-4 py-2 rounded-full transition-all ${
              activeScanMode === 'barcode' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Barcode
          </button>

          <button
            onClick={() => setActiveScanMode('label')}
            className={`px-4 py-2 rounded-full transition-all ${
              activeScanMode === 'label' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Label (OCR)
          </button>

          <button
            onClick={() => setActiveScanMode('upload')}
            className={`px-4 py-2 rounded-full transition-all ${
              activeScanMode === 'upload' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload
          </button>

          <button
            onClick={() => setActiveScanMode('manual')}
            className={`px-4 py-2 rounded-full transition-all ${
              activeScanMode === 'manual' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>

      </div>

      {/* Manual Input Form Panel if Mode is Manual */}
      {activeScanMode === 'manual' && (
        <div className="card-fresh p-6 space-y-3">
          <form onSubmit={handleManualLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Type 12–13 digit barcode e.g. 8901058852387"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-[#F8F8F4] border border-[#E5E9E6] text-sm font-mono text-[#17201C] focus:outline-none focus:border-[#164B3A]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-extrabold bg-[#164B3A] text-white hover:bg-[#0F3629]"
            >
              Lookup
            </button>
          </form>
        </div>
      )}

      {/* Label Upload Submission Button if file selected */}
      {(activeScanMode === 'upload' || activeScanMode === 'label') && selectedFile && (
        <div className="card-mint p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-[#164B3A]">
            Selected file: {selectedFile.name}
          </span>
          <button
            onClick={handleOcrSubmit}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-extrabold bg-[#164B3A] text-white text-xs hover:bg-[#0F3629] flex items-center gap-1.5 shadow-sm"
          >
            Analyze via AI OCR <ArrowRight className="w-4 h-4" />
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
