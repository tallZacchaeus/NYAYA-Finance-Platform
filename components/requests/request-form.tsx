'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { RequestCategory } from '@/lib/types';

const requestSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(200, 'Purpose too long'),
  category: z.enum(['travel', 'supplies', 'events', 'utilities', 'personnel', 'other']),
  description: z.string().max(1000, 'Description too long').optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const CATEGORY_OPTIONS = [
  { value: 'travel', label: 'Travel' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'events', label: 'Events' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'other', label: 'Other' },
];

interface UploadedFile {
  file: File;
  type: 'supporting' | 'invoice' | 'quote';
}

export function RequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: 'other',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      type: 'supporting',
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileType = (index: number, type: 'supporting' | 'invoice' | 'quote') => {
    setUploadedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, type } : f))
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(data.amount),
          purpose: data.purpose,
          category: data.category as RequestCategory,
          description: data.description || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      const { request } = await res.json();

      // Upload files if any
      if (uploadedFiles.length > 0) {
        for (const uploadedFile of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', uploadedFile.file);
          formData.append('type', uploadedFile.type);

          await fetch(`/api/requests/${request.id}/documents`, {
            method: 'POST',
            body: formData,
          });
        }
      }

      toast.success('Request submitted successfully!');
      reset();
      setUploadedFiles([]);
      router.push('/requester');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Amount */}
        <Input
          {...register('amount')}
          label="Amount (NGN)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.amount?.message}
          leftAddon={<span className="text-gray-500 text-sm font-medium">₦</span>}
        />

        {/* Category */}
        <Select
          {...register('category')}
          label="Category"
          options={CATEGORY_OPTIONS}
          placeholder="Select category"
          error={errors.category?.message}
        />
      </div>

      {/* Purpose */}
      <Input
        {...register('purpose')}
        label="Purpose"
        type="text"
        placeholder="Brief description of what the funds will be used for"
        error={errors.purpose?.message}
      />

      {/* Description */}
      <Textarea
        {...register('description')}
        label="Additional Details"
        placeholder="Provide any additional context, justification, or breakdown of costs..."
        rows={4}
        error={errors.description?.message}
        hint="Optional - provide more detail about this request"
      />

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Documents <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop files here, or{' '}
            <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
              browse
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-gray-400">PDF, Images, Word, Excel up to 10MB each</p>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(uploadedFile.file.size)}</p>
                </div>
                <select
                  value={uploadedFile.type}
                  onChange={(e) =>
                    updateFileType(index, e.target.value as 'supporting' | 'invoice' | 'quote')
                  }
                  className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 bg-white"
                >
                  <option value="supporting">Supporting</option>
                  <option value="invoice">Invoice</option>
                  <option value="quote">Quote</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
