'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Upload, X, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoldButton } from '@/components/ui/gold-button';
import { NairaAmount } from '@/components/ui/naira-amount';
import { api, ApiError, type Department, type ApiEvent } from '@/lib/api-client';

const requestSchema = z.object({
  title:        z.string().min(5, 'Title must be at least 5 characters').max(255),
  description:  z.string().max(1000).optional(),
  unit_cost:    z.string().min(1, 'Unit cost is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: 'Must be a positive number' }),
  quantity:     z.string().min(1, 'Quantity is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, { message: 'Minimum quantity is 1' }),
  request_type: z.enum(['cash_disbursement', 'procurement']),
  department_id: z.string().min(1, 'Please select a department'),
  event_id:     z.string().min(1, 'Please select an event'),
});

type RequestFormData = z.infer<typeof requestSchema>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 font-body text-xs text-[#F87171]">{message}</p>;
}

export function RequestForm() {
  const router = useRouter();
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [uploadedFiles,  setUploadedFiles]  = useState<File[]>([]);
  const [departments,    setDepartments]    = useState<Department[]>([]);
  const [events,         setEvents]         = useState<ApiEvent[]>([]);

  useEffect(() => {
    Promise.all([api.departments.list(), api.events.list()]).then(([dRes, eRes]) => {
      setDepartments(dRes.data ?? []);
      setEvents((eRes.data ?? []).filter((ev) => ev.status !== 'cancelled'));
    }).catch(() => { /* non-fatal */ });
  }, []);

  const {
    register, handleSubmit, watch, formState: { errors }, reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { request_type: 'procurement', quantity: '1' },
  });

  const unitCost   = Number(watch('unit_cost')  || 0);
  const quantity   = Number(watch('quantity')   || 1);
  const totalNaira = unitCost * quantity;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      // request_type_id: 1=Cash Disbursement, 2=Procurement (matches seed order)
      const typeIdMap: Record<string, number> = { cash_disbursement: 1, procurement: 2 };
      const res = await api.internalRequests.create({
        title:           data.title,
        description:     data.description || undefined,
        unit_cost_kobo:  Math.round(Number(data.unit_cost) * 100),
        quantity:        Number(data.quantity),
        request_type_id: typeIdMap[data.request_type] ?? 1,
        department_id:   Number(data.department_id),
        event_id:        Number(data.event_id),
      });

      const requestId = res.data.id;
      for (const file of uploadedFiles) {
        try {
          await api.internalRequests.uploadDocument(requestId, file);
        } catch {
          toast.error(`Could not upload ${file.name}`);
        }
      }

      toast.success('Request submitted successfully!');
      reset();
      setUploadedFiles([]);
      router.push('/my-requests');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? (error.message ?? 'Failed to submit request') : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-lg font-body text-sm text-[#F5E8D3] placeholder-[#A89FB8] bg-[#1A0F4D] border border-[#2D1A73] focus:outline-none focus:border-[#BB913B] focus:bg-[#2D1A73] transition-all';
  const selectCls = `${inputCls} appearance-none`;
  const labelCls  = 'block font-body text-xs font-medium text-[#A89FB8] mb-1.5';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 font-body text-sm text-[#A89FB8] hover:text-[#A89FB8] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Submit Financial Request</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-1">
          Fill in the details below. Your request will go through recommendation and approval before payment is processed.
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="rounded-2xl p-6 md:p-8 bg-[#13093B] border border-[#2D1A73]"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className={labelCls}>Request Title</label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Sound system rental for main stage"
              className={inputCls}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Type + Dept + Event */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Request Type</label>
              <select {...register('request_type')} className={selectCls}>
                <option value="cash_disbursement">Cash Disbursement</option>
                <option value="procurement">Procurement</option>
              </select>
              <FieldError message={errors.request_type?.message} />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <select {...register('department_id')} className={selectCls} defaultValue="">
                <option value="" disabled>Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </select>
              <FieldError message={errors.department_id?.message} />
            </div>
            <div>
              <label className={labelCls}>Event</label>
              <select {...register('event_id')} className={selectCls} defaultValue="">
                <option value="" disabled>Select event</option>
                {events.map(e => (
                  <option key={e.id} value={String(e.id)}>{e.name}</option>
                ))}
              </select>
              <FieldError message={errors.event_id?.message} />
            </div>
          </div>

          {/* Unit cost + Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Unit Cost (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-[#A89FB8]">₦</span>
                <input
                  {...register('unit_cost')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`${inputCls} pl-8`}
                />
              </div>
              <FieldError message={errors.unit_cost?.message} />
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input
                {...register('quantity')}
                type="number"
                min="1"
                step="1"
                placeholder="1"
                className={inputCls}
              />
              <FieldError message={errors.quantity?.message} />
            </div>
          </div>

          {/* Live total */}
          {totalNaira > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-4 bg-[#1F1450] border border-[#1A0F4D] flex items-center justify-between"
            >
              <p className="font-body text-sm text-[#A89FB8]">Total Amount</p>
              <NairaAmount amount={totalNaira} className="text-lg" />
            </motion.div>
          )}

          {/* Description */}
          <div>
            <label className={labelCls}>
              Additional Details <span className="opacity-50 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Provide any additional context, justification, or cost breakdown…"
              rows={4}
              className={`${inputCls} resize-none`}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* File Upload */}
          <div>
            <label className={labelCls}>
              Supporting Documents <span className="opacity-50 font-normal">(optional)</span>
            </label>
            <label className="block w-full border border-dashed border-[#3D2590] rounded-xl p-6 text-center cursor-pointer hover:border-[#2D1A73] hover:bg-[#1F1450] transition-all group">
              <Upload className="w-7 h-7 text-[#A89FB8] group-hover:text-[#D4A843] mx-auto mb-2 transition-colors" />
              <p className="font-body text-sm text-[#A89FB8] group-hover:text-[#A89FB8] transition-colors">
                Click to select files, or drag & drop
              </p>
              <p className="font-body text-xs text-[#A89FB8] mt-1">PDF, JPG, PNG up to 10MB each</p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#13093B] border border-[#2D1A73]"
                  >
                    <FileText className="w-4 h-4 text-[#A89FB8] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-[#A89FB8] truncate">{file.name}</p>
                      <p className="font-body text-xs text-[#A89FB8]">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(index)}
                      className="p-1 text-[#A89FB8] hover:text-[#F87171] transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1A0F4D]">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg font-body text-sm text-[#A89FB8] border border-[#2D1A73] hover:bg-[#1A0F4D] transition-colors"
            >
              Cancel
            </button>
            <GoldButton type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </GoldButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
