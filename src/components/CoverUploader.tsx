import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { api } from '../services/api';

interface CoverUploaderProps {
  label: string;
  helperText?: string;
  value?: string | null;
  onChange: (url: string) => void;
  aspectRatio?: '3/4' | '16/9' | 'auto';
  curatedCovers?: Array<{ label: string; url: string }>;
}

export const CoverUploader: React.FC<CoverUploaderProps> = ({
  label,
  helperText = 'Supported formats: JPEG, PNG, WebP (up to 5MB)',
  value,
  onChange,
  aspectRatio = '3/4',
  curatedCovers = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === '3/4'
      ? 'aspect-[3/4] max-w-[220px]'
      : aspectRatio === '16/9'
      ? 'aspect-video max-w-sm'
      : 'min-h-[180px] max-w-sm';

  const handleFile = async (file: File) => {
    setError(null);
    setSuccessNotice(null);

    // Frontend validation: file format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid format. Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Frontend validation: file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 5MB.`);
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadCover(file);
      onChange(res.url);
      setSuccessNotice('Cover uploaded and ready');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 font-serif">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wider text-[#68715F] font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlFallback(!showUrlFallback)}
          className="text-[11px] text-[#68715F] hover:text-[#28311F] hover:underline"
        >
          {showUrlFallback ? 'Hide URL input' : 'Enter URL manually'}
        </button>
      </div>

      {/* Main Upload / Drag & Drop / Preview Card */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Preview Frame */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={!value ? triggerPicker : undefined}
          className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col items-center justify-center p-3 text-center ${
            isDragging
              ? 'border-[#2C3A22] bg-[#DDE5D2]/50 scale-[1.02]'
              : 'border-dashed border-[#2C3A22]/25 bg-white/50 hover:bg-white/80'
          } ${!value ? 'cursor-pointer' : ''}`}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Cover Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {/* Overlay with quick actions */}
              <div className="absolute inset-0 bg-[#28311F]/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                <button
                  type="button"
                  onClick={triggerPicker}
                  className="px-3 py-1.5 rounded-lg bg-white/90 text-[#28311F] text-xs font-serif shadow-sm hover:bg-white flex items-center gap-1.5 cursor-pointer"
                  title="Replace with another file"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-serif shadow-sm hover:bg-red-700 flex items-center gap-1 cursor-pointer"
                  title="Remove cover"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#2C3A22]/10 border border-[#2C3A22]/15 flex items-center justify-center text-[#2C3A22] mb-3">
                <Upload className="w-5 h-5 stroke-[1.75]" />
              </div>
              <p className="text-xs font-medium text-[#28311F] mb-1">
                Drop image here, or <span className="text-[#2C3A22] underline">browse</span>
              </p>
              <p className="text-[10px] text-[#68715F] leading-tight max-w-[170px]">
                Mobile, tablet, or desktop photo library
              </p>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
              <div className="w-6 h-6 border-2 border-[#2C3A22] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#28311F] font-serif">Uploading cover...</span>
            </div>
          )}
        </div>

        {/* Action Controls and Information */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={triggerPicker}
              className="px-4 py-2 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-50 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{value ? 'Replace Cover Image' : 'Select from Device'}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3.5 py-2 bg-white/70 hover:bg-white text-red-800 border border-red-200 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[#68715F] leading-relaxed">
            {helperText}
          </p>

          {/* Feedback banners */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-100/90 border border-red-200 text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-2.5 rounded-lg bg-[#DDE5D2] border border-[#2C3A22]/20 text-xs text-[#2C3A22] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Curated covers quick pickers if provided */}
          {curatedCovers.length > 0 && (
            <div className="pt-2 border-t border-[#2C3A22]/10">
              <span className="text-[11px] text-[#68715F] block mb-1.5">Or choose from catalog covers:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {curatedCovers.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(c.url);
                      setError(null);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      value === c.url
                        ? 'bg-[#2C3A22] text-[#EEF0E4] border-[#2C3A22]'
                        : 'bg-white/60 hover:bg-white text-[#28311F] border-[#2C3A22]/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* URL Fallback Input */}
          {showUrlFallback && (
            <div className="pt-2 border-t border-[#2C3A22]/10">
              <label className="block text-[11px] text-[#68715F] mb-1">Direct Image URL</label>
              <input
                type="text"
                placeholder="https://... or /uploads/covers/..."
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
};
