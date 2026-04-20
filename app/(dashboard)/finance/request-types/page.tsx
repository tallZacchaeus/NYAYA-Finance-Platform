'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RequestType } from '@/lib/api-client';
import { api, ApiError } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

interface TypeFormData {
  name: string;
  description: string;
  is_active: boolean;
}

function TypeFormModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: RequestType;
  onSave: (data: TypeFormData) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<TypeFormData>({
    name:        initial?.name        ?? '',
    description: initial?.description ?? '',
    is_active:   initial?.is_active   ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl bg-[#0D1623] border border-[#2D1A73] p-6 space-y-4"
      >
        <h2 className="font-display text-lg text-[#F5E8D3]">
          {initial ? 'Edit Request Type' : 'New Request Type'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="font-body text-xs text-[#A89FB8] mb-1.5 block">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Cash Disbursement"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="font-body text-xs text-[#A89FB8] mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={[
                'relative w-10 h-5.5 rounded-full transition-colors',
                form.is_active ? 'bg-[#D4A843]' : 'bg-[#3D2590]',
              ].join(' ')}
            >
              <span className={[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow',
                form.is_active ? 'translate-x-5' : 'translate-x-0.5',
              ].join(' ')} />
            </div>
            <span className="font-body text-sm text-[#A89FB8]">Active</span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <GoldButton
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving…' : initial ? 'Save Changes' : 'Create Type'}
          </GoldButton>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-body text-sm font-medium text-[#A89FB8] border border-[#2D1A73] hover:border-[#3D2590] transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function RequestTypesPage() {
  const [types,      setTypes]      = useState<RequestType[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<RequestType | null>(null);
  const [isSaving,   setIsSaving]   = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await api.requestTypes.list();
      setTypes(res.data ?? []);
    } catch {
      toast.error('Failed to load request types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleSave = async (data: TypeFormData) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        const res = await api.requestTypes.update(editTarget.id, data);
        setTypes(ts => ts.map(t => t.id === editTarget.id ? res.data : t));
        toast.success('Request type updated');
      } else {
        const res = await api.requestTypes.create({ name: data.name, description: data.description || undefined });
        setTypes(ts => [...ts, res.data]);
        toast.success('Request type created');
      }
      setShowModal(false);
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: RequestType) => {
    if (!confirm(`Delete "${type.name}"? This cannot be undone.`)) return;
    setDeleting(type.id);
    try {
      await api.requestTypes.destroy(type.id);
      setTypes(ts => ts.filter(t => t.id !== type.id));
      toast.success('Request type deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => { setEditTarget(null); setShowModal(true); };
  const openEdit   = (t: RequestType) => { setEditTarget(t); setShowModal(true); };

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">Request Types</h1>
          <p className="font-body text-sm text-[#A89FB8] mt-0.5">Manage categories for finance requests</p>
        </div>
        <GoldButton onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Type
        </GoldButton>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-10 text-center font-body text-sm text-[#A89FB8]">
          Loading…
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No request types"
            description="Create request types to categorise finance requests."
            icon={<Tag className="w-7 h-7" />}
            action={
              <GoldButton onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Type
              </GoldButton>
            }
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {types.map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-[#A89FB8] font-medium">{t.name}</p>
                      <p className="font-mono text-xs text-[#A89FB8] mt-0.5">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs max-w-xs truncate">
                      {t.description ?? <span className="text-[#A89FB8]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#34D399]">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#A89FB8]">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg text-[#A89FB8] hover:text-[#D4A843] hover:bg-[#1F1450] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          disabled={deleting === t.id}
                          className="p-1.5 rounded-lg text-[#A89FB8] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <TypeFormModal
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditTarget(null); }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
