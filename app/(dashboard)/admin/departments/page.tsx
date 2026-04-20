'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError, type Department } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

const inputCls = 'w-full px-4 py-2.5 rounded-lg font-body text-sm text-[#F5E8D3] placeholder-[#A89FB8] bg-[#1A0F4D] border border-[#2D1A73] focus:outline-none focus:border-[#BB913B] focus:bg-[#2D1A73] transition-all';
const labelCls = 'block font-body text-xs font-medium text-[#A89FB8] mb-1.5';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName,  setEditName]  = useState('');
  const [editDesc,  setEditDesc]  = useState('');
  const [isSaving,  setIsSaving]  = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.departments.list();
      setDepartments(res.data ?? []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreating(true);
    try {
      const res = await api.departments.create({ name: createName.trim(), description: createDesc.trim() || undefined });
      setDepartments(prev => [...prev, res.data]);
      setCreateName(''); setCreateDesc(''); setShowCreate(false);
      toast.success('Department created');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create department');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description ?? '');
  };

  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditDesc(''); };

  const handleSave = async (id: number) => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const res = await api.departments.update(id, { name: editName.trim(), description: editDesc.trim() || undefined });
      setDepartments(prev => prev.map(d => d.id === id ? res.data : d));
      cancelEdit();
      toast.success('Department updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update department');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.departments.destroy(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast.success('Department deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete department');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">Departments</h1>
          {!isLoading && (
            <p className="font-body text-sm text-[#A89FB8] mt-0.5">
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <GoldButton onClick={() => setShowCreate(true)} className="gap-2 text-sm">
          <Plus className="w-4 h-4" />
          New Department
        </GoldButton>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCreate}
            className="rounded-xl p-5 bg-[#1F1450] border border-[#1A0F4D] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-[#F5E8D3]">New Department</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                className="p-1 text-[#A89FB8] hover:text-[#A89FB8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className={labelCls}>Department Name *</label>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="e.g. Transport"
                className={inputCls}
                autoFocus
                required
              />
            </div>
            <div>
              <label className={labelCls}>Description <span className="opacity-50">(optional)</span></label>
              <input
                type="text"
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
                placeholder="Brief description"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg font-body text-sm text-[#A89FB8] border border-[#2D1A73] hover:bg-[#1A0F4D] transition-colors"
              >
                Cancel
              </button>
              <GoldButton type="submit" disabled={isCreating} className="gap-2">
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </GoldButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Loading…
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No departments yet"
            description="Create your first department to get started."
            icon={<Building2 className="w-7 h-7" />}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
          {departments.map((dept, i) => (
            <div
              key={dept.id}
              className={[
                'p-4 border-b border-[#1A0F4D] last:border-0',
                editingId === dept.id ? 'bg-[#1F1450]' : 'hover:bg-[#13093B]',
              ].join(' ')}
            >
              {editingId === dept.id ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className={inputCls}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      aria-label="Cancel edit"
                      className="p-1.5 text-[#A89FB8] hover:text-[#A89FB8] transition-colors rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(dept.id)}
                      disabled={isSaving}
                      aria-label="Save changes"
                      className="p-1.5 text-[#34D399] hover:text-[rgba(52,211,153,0.8)] transition-colors rounded"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F1450] flex items-center justify-center text-[#D4A843] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-[#A89FB8]">{dept.name}</p>
                    {dept.description && (
                      <p className="font-body text-xs text-[#A89FB8] truncate mt-0.5">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(dept)}
                      aria-label={`Edit ${dept.name}`}
                      className="p-1.5 text-[#A89FB8] hover:text-[#D4A843] rounded transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept.id)}
                      disabled={deletingId === dept.id}
                      aria-label={`Delete ${dept.name}`}
                      className="p-1.5 text-[#A89FB8] hover:text-[#F87171] rounded transition-colors"
                    >
                      {deletingId === dept.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
