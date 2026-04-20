'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, ArrowLeft, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError, type BudgetImportPreview } from '@/lib/api-client';
import { NairaAmount } from '@/components/ui/naira-amount';
import { GoldButton } from '@/components/ui/gold-button';

type Step = 'upload' | 'preview' | 'success';

const STEPS: Step[] = ['upload', 'preview', 'success'];
const STEP_LABELS: Record<Step, string> = { upload: 'Upload', preview: 'Preview', success: 'Done' };

export default function BudgetImportPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const eventId = Number(id);

  const [step,           setStep]           = useState<Step>('upload');
  const [file,           setFile]           = useState<File | null>(null);
  const [isParsing,      setIsParsing]      = useState(false);
  const [isConfirming,   setIsConfirming]   = useState(false);
  const [preview,        setPreview]        = useState<BudgetImportPreview | null>(null);
  const [importedCount,  setImportedCount]  = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setFile(f);
    } else {
      toast.error('Please upload an Excel (.xlsx/.xls) or CSV file');
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const res = await api.budgets.importPreview(eventId, file);
      setPreview(res.data);
      setStep('preview');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to parse file. Check the format and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setIsConfirming(true);
    try {
      const res = await api.budgets.importConfirm(eventId, preview.preview_token);
      setImportedCount(res.data?.length ?? preview.rows.length);
      setStep('success');
      toast.success('Budget imported successfully');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetUpload = () => {
    setFile(null); setPreview(null); setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentIdx = STEPS.indexOf(step);

  return (
    <div className="p-5 sm:p-7 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push(`/admin/events/${eventId}/dashboard`)}
        className="inline-flex items-center gap-2 font-body text-sm text-[#A89FB8] hover:text-[#A89FB8] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event Dashboard
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Import Budget</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Upload an Excel spreadsheet to import department budgets</p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isActive = s === step;
          const isDone   = i < currentIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={['w-8 h-px', isDone ? 'bg-[rgba(52,211,153,0.4)]' : 'bg-[#2D1A73]'].join(' ')} />}
              <div className={[
                'flex items-center gap-1.5 font-body text-xs font-medium',
                isActive ? 'text-[#D4A843]' : isDone ? 'text-[#34D399]' : 'text-[#A89FB8]',
              ].join(' ')}>
                <span className={[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                  isActive ? 'bg-[#1A0F4D] text-[#D4A843] border border-[#2D1A73]'
                            : isDone ? 'bg-[rgba(52,211,153,0.15)] text-[#34D399] border border-[rgba(52,211,153,0.3)]'
                            : 'bg-[#1A0F4D] text-[#A89FB8] border border-[#2D1A73]',
                ].join(' ')}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline capitalize">{STEP_LABELS[s]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-6 bg-[#13093B] border border-[#2D1A73] space-y-5"
          >
            <div>
              <h2 className="font-display text-base text-[#F5E8D3] mb-1">Upload Budget File</h2>
              <p className="font-body text-sm text-[#A89FB8]">
                Each sheet represents a department, with columns: Item Description, Quantity, Unit Cost, Total.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className={[
                'border border-dashed rounded-xl p-8 text-center transition-all',
                file
                  ? 'border-[#BB913B] bg-[#1F1450]'
                  : 'border-[#3D2590] hover:border-[#2D1A73] hover:bg-[#1F1450]',
              ].join(' ')}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-[#D4A843] shrink-0" />
                  <div className="text-left">
                    <p className="font-body text-sm font-medium text-[#A89FB8]">{file.name}</p>
                    <p className="font-body text-xs text-[#A89FB8]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetUpload}
                    aria-label="Remove file"
                    className="ml-2 p-1 text-[#A89FB8] hover:text-[#F87171] rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-9 h-9 text-[#A89FB8] mx-auto mb-3" />
                  <p className="font-body text-sm text-[#A89FB8]">
                    Drag & drop your file here, or{' '}
                    <label className="text-[#D4A843] hover:opacity-80 cursor-pointer font-medium">
                      browse
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                    </label>
                  </p>
                  <p className="font-body text-xs text-[#A89FB8] mt-1">Excel (.xlsx, .xls) or CSV</p>
                </>
              )}
            </div>

            {/* Format hint */}
            <div className="rounded-lg p-3 bg-[#13093B] border border-[#2D1A73]">
              <p className="font-body text-xs font-medium text-[#A89FB8] mb-1">Expected columns</p>
              <p className="font-mono text-xs text-[#A89FB8]">Item Description | Quantity | Unit Cost | Total</p>
            </div>

            <div className="flex justify-end">
              <GoldButton onClick={handlePreview} disabled={!file || isParsing} className="gap-2">
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {isParsing ? 'Parsing…' : 'Preview Import'}
              </GoldButton>
            </div>
          </motion.div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-6 bg-[#13093B] border border-[#2D1A73] space-y-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-base text-[#F5E8D3]">Import Preview</h2>
                <p className="font-body text-sm text-[#A89FB8] mt-0.5">Review before confirming.</p>
              </div>
              <div className="text-right">
                <p className="font-body text-xs text-[#A89FB8]">Total</p>
                <NairaAmount amount={preview.total} className="text-lg" />
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings && preview.warnings.length > 0 && (
              <div className="rounded-lg p-3 bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.2)]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-body text-sm font-medium text-[#FBBF24] mb-1">Warnings</p>
                    <ul className="font-body text-xs text-[#A89FB8] space-y-0.5 list-disc list-inside">
                      {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Dept rows */}
            <div className="divide-y divide-[#1A0F4D]">
              {preview.rows.map((row, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-body text-sm font-semibold text-[#A89FB8]">{row.department}</p>
                    <NairaAmount amount={row.allocated_amount} compact className="text-sm" />
                  </div>
                  {row.line_items && row.line_items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {row.line_items.slice(0, 5).map((item, j) => (
                        <div key={j} className="flex items-center justify-between font-body text-xs text-[#A89FB8] pl-3">
                          <span className="truncate mr-4">{item.description}</span>
                          <span className="shrink-0">{item.quantity} × <NairaAmount amount={item.unit_cost} compact className="text-xs inline" /></span>
                        </div>
                      ))}
                      {row.line_items.length > 5 && (
                        <p className="font-body text-xs text-[#A89FB8] pl-3">+{row.line_items.length - 5} more items</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#1A0F4D]">
              <button
                type="button"
                onClick={resetUpload}
                className="px-4 py-2.5 rounded-lg font-body text-sm text-[#A89FB8] border border-[#2D1A73] hover:bg-[#1A0F4D] transition-colors"
              >
                Change File
              </button>
              <GoldButton onClick={handleConfirm} disabled={isConfirming} className="gap-2">
                {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isConfirming ? 'Importing…' : `Confirm Import (${preview.rows.length} departments)`}
              </GoldButton>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-8 bg-[rgba(52,211,153,0.04)] border border-[rgba(52,211,153,0.18)] text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[rgba(52,211,153,0.12)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#34D399]" />
            </div>
            <h2 className="font-display text-xl text-[#F5E8D3] mb-2">Import Successful</h2>
            <p className="font-body text-sm text-[#A89FB8] mb-6">
              {importedCount} department budget{importedCount !== 1 ? 's' : ''} have been imported.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={resetUpload}
                className="px-4 py-2.5 rounded-lg font-body text-sm text-[#A89FB8] border border-[#2D1A73] hover:bg-[#1A0F4D] transition-colors"
              >
                Import Another File
              </button>
              <GoldButton onClick={() => router.push(`/admin/events/${eventId}/dashboard`)} className="gap-2">
                View Event Dashboard
              </GoldButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
