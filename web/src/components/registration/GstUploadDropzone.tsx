import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import { DocumentValidator, type GstValidationResult } from '../../utils/mediapipeValidator';

interface GstUploadDropzoneProps {
  gstNumber: string;
  onValidationComplete: (result: GstValidationResult | null) => void;
  disabled?: boolean;
}

export const GstUploadDropzone: React.FC<GstUploadDropzoneProps> = ({
  gstNumber,
  onValidationComplete,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    setIsValidating(true);

    const result = await DocumentValidator.inspectPdfDocument(file, gstNumber);

    setIsValidating(false);

    if (!result.isValid) {
      setErrorMsg(result.error || 'Validation failed.');
      onValidationComplete(null);
      setDigest(null);
    } else {
      setDigest(result.evidenceDigest || null);
      onValidationComplete(result);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isValidating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    setDigest(null);
    onValidationComplete(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3 font-mono">
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        className="hidden"
        disabled={disabled || isValidating}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 text-center card-polygon transition-all ${
          selectedFile && !errorMsg
            ? 'border-stellar-yellow bg-stellar-yellow/5'
            : errorMsg
            ? 'border-red-500/80 bg-red-950/20'
            : 'border-[#232938] hover:border-stellar-yellow/60 bg-[#0B0D13] cursor-pointer'
        }`}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-stellar-yellow" />
              <div>
                <p className="text-xs text-white font-bold truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-[10px] text-stellar-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:text-red-400 text-stellar-muted"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <UploadCloud className="w-10 h-10 text-stellar-muted group-hover:text-stellar-yellow" />
            <p className="text-xs text-white">
              Drop GST Registration Certificate (PDF) here, or{' '}
              <span className="text-stellar-yellow underline">browse</span>
            </p>
            <p className="text-[10px] text-stellar-muted">Maximum file size: 4MB</p>
          </div>
        )}
      </div>

      {isValidating && (
        <div className="text-xs text-stellar-yellow flex items-center gap-2">
          <span className="animate-spin text-sm">⟳</span> Validating structure and generating SHA-256 hash...
        </div>
      )}

      {errorMsg && (
        <div className="text-xs text-red-400 flex items-center gap-2 bg-red-950/30 p-2 border border-red-800/40">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {digest && !errorMsg && (
        <div className="text-[11px] bg-[#121620] border border-[#232938] p-2 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-stellar-muted truncate">
            Digest: <span className="text-stellar-yellow">{digest}</span>
          </span>
        </div>
      )}
    </div>
  );
};