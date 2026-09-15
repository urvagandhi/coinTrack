'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, LineChart } from 'lucide-react';
import { mutualFundAPI } from '@/lib/api';
import { useToast } from '@/components/ui/feedback/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';

export default function ValuationSnapshotModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    holderName: '',
    platform: '',
    snapshotDate: new Date().toISOString().substring(0, 10),
    investmentValue: '',
    currentValue: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await mutualFundAPI.deleteValuation(initialData.id);
      toast({
        title: 'Snapshot Deleted',
        description: 'Successfully deleted valuation snapshot.',
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description:
          err.response?.data?.message || 'Failed to delete snapshot.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let dateStr = initialData.snapshotDate;
        if (Array.isArray(dateStr)) {
          const [y, m, d] = dateStr;
          dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        setFormData({
          holderName: initialData.holderName || '',
          platform: initialData.platform || '',
          snapshotDate: dateStr || new Date().toISOString().substring(0, 10),
          investmentValue: initialData.investmentValue || '',
          currentValue: initialData.currentValue || '',
        });
      } else {
        setFormData({
          holderName: '',
          platform: '',
          snapshotDate: new Date().toISOString().substring(0, 10),
          investmentValue: '',
          currentValue: '',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        investmentValue: formData.investmentValue
          ? parseFloat(formData.investmentValue)
          : 0,
        currentValue: formData.currentValue
          ? parseFloat(formData.currentValue)
          : 0,
      };

      if (initialData?.id) {
        await mutualFundAPI.updateValuation(initialData.id, payload);
        toast({
          title: 'Snapshot Updated',
          description: `Successfully updated valuation snapshot.`,
        });
      } else {
        await mutualFundAPI.createValuation(payload);
        toast({
          title: 'Snapshot Created',
          description: `Successfully created valuation snapshot.`,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: initialData ? 'Update Failed' : 'Creation Failed',
        description:
          err.response?.data?.message || 'Failed to save valuation snapshot.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4'>
      <div className='ed-card w-full max-w-md bg-card border border-border shadow-2xl relative overflow-y-auto max-h-[90vh] hide-scrollbar'>
        <span className='corner-mark corner-tl' />
        <span className='corner-mark corner-tr' />
        <span className='corner-mark corner-bl' />
        <span className='corner-mark corner-br' />

        <div className='p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10'>
          <div className='flex items-center gap-2'>
            <LineChart className='h-4 w-4 text-accent' />
            <h2 className='font-serif italic text-lg'>
              {initialData ? 'Edit Snapshot' : 'New Snapshot'}
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-5 space-y-4'>
          <div className='space-y-1.5'>
            <label className='eyebrow'>Holder Name</label>
            <input
              type='text'
              name='holderName'
              value={formData.holderName}
              onChange={handleChange}
              required
              className='ed-input w-full font-mono text-base py-2'
              placeholder='e.g. John Doe'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='eyebrow'>Platform</label>
            <input
              type='text'
              name='platform'
              value={formData.platform}
              onChange={handleChange}
              required
              className='ed-input w-full font-mono text-base py-2'
              placeholder='e.g. Zerodha, Groww'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='eyebrow'>Snapshot Date</label>
            <input
              type='date'
              name='snapshotDate'
              value={formData.snapshotDate}
              onChange={handleChange}
              required
              className='ed-input w-full font-mono text-base py-2'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='eyebrow'>Investment Value</label>
            <input
              type='number'
              step='any'
              name='investmentValue'
              value={formData.investmentValue}
              onChange={handleChange}
              required
              className='ed-input w-full font-mono text-base py-2'
              placeholder='e.g. 100000'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='eyebrow'>Current Value</label>
            <input
              type='number'
              step='any'
              name='currentValue'
              value={formData.currentValue}
              onChange={handleChange}
              required
              className='ed-input w-full font-mono text-base py-2'
              placeholder='e.g. 120000'
            />
          </div>

          <div className='pt-4 border-t border-border flex justify-between items-center gap-2'>
            {initialData && (
              <button
                type='button'
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleteLoading}
                className='text-[12px] font-mono text-[hsl(var(--loss))] hover:underline disabled:opacity-50'
              >
                Delete Snapshot
              </button>
            )}
            {!initialData && <div />}
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={onClose}
                className='ed-btn bg-card border-border hover:bg-muted text-foreground'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='ed-btn ed-btn-accent min-w-[100px]'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Snapshot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this snapshot? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
