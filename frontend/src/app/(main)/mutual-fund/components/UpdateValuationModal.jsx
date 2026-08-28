'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, IndianRupee } from 'lucide-react';
import { mutualFundAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function UpdateValuationModal({
  isOpen,
  onClose,
  scheme,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    manualTotalUnits: '',
    manualAverageNav: '',
    manualCurrentValue: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && scheme) {
      setFormData({
        manualTotalUnits: scheme.manualTotalUnits ?? '',
        manualAverageNav: scheme.manualAverageNav ?? '',
        manualCurrentValue: scheme.manualCurrentValue ?? '',
      });
    }
  }, [isOpen, scheme]);

  if (!isOpen || !scheme) return null;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        manualTotalUnits: formData.manualTotalUnits
          ? parseFloat(formData.manualTotalUnits)
          : null,
        manualAverageNav: formData.manualAverageNav
          ? parseFloat(formData.manualAverageNav)
          : null,
        manualCurrentValue: formData.manualCurrentValue
          ? parseFloat(formData.manualCurrentValue)
          : null,
      };

      await mutualFundAPI.updateScheme(scheme.schemeId || scheme.id, payload);

      toast({
        title: 'Valuation Updated',
        description: `Successfully updated manual valuation for ${scheme.schemeName}.`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description:
          err.response?.data?.message || 'Failed to update valuation.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4'>
      <div className='ed-card w-full max-w-md bg-card border border-border shadow-2xl relative'>
        <span className='corner-mark corner-tl' />
        <span className='corner-mark corner-tr' />
        <span className='corner-mark corner-bl' />
        <span className='corner-mark corner-br' />

        <div className='p-5 border-b border-border flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <IndianRupee className='h-4 w-4 text-accent' />
            <h2 className='font-serif italic text-lg'>
              Update Valuation Overrides
            </h2>
          </div>
          <button
            onClick={onClose}
            className='w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-5 space-y-4'>
          <div className='space-y-1'>
            <p className='font-serif text-[15px] font-medium text-foreground'>
              {scheme.schemeName}
            </p>
            <p className='text-[11px] font-mono text-muted-foreground'>
              {scheme.platform} • Folio: {scheme.folioNo || 'N/A'}
            </p>
          </div>

          <div className='space-y-4 pt-2'>
            {/* Manual total units disabled per user request
            <div className="space-y-1.5">
              <label className="eyebrow">Manual Total Units</label>
              <input
                type="number"
                step="any"
                name="manualTotalUnits"
                value={formData.manualTotalUnits}
                onChange={handleChange}
                placeholder="e.g. 154.208"
                className="ed-input w-full font-mono text-base py-2"
              />
            </div>
            */}

            <div className='space-y-1.5'>
              <label className='eyebrow'>Manual Average NAV</label>
              <input
                type='number'
                step='any'
                name='manualAverageNav'
                value={formData.manualAverageNav}
                onChange={handleChange}
                placeholder='e.g. 52.34'
                className='ed-input w-full font-mono text-base py-2'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='eyebrow'>Manual Current Value (₹)</label>
              <input
                type='number'
                step='any'
                name='manualCurrentValue'
                value={formData.manualCurrentValue}
                onChange={handleChange}
                placeholder='e.g. 15000.50'
                className='ed-input w-full font-mono text-base py-2'
              />
              <p className='text-[11px] text-muted-foreground leading-relaxed mt-1'>
                Use these fields to override calculated values for
                external/offline tracked funds. Leave empty to restore automatic
                calculation.
              </p>
            </div>
          </div>

          <div className='pt-4 border-t border-border flex justify-end gap-2'>
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
                'Save Overrides'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
