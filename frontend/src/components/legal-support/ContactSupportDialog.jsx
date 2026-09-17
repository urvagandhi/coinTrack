'use client';

import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/feedback/use-toast';
import { contactAPI } from '@/lib/api';
import BaseDialog from '@/components/ui/feedback/base-dialog';
import { Button } from '@/components/ui/primitives/button';
import {
  InsetFormCard,
  InsetFormRow,
  InsetTextInput,
  InsetEmailInput,
  EmailValidationBadge,
  InsetTextareaRow,
} from '@/components/ui/forms/inset-form-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/primitives/tabs';
import {
  Mail,
  Send,
  Loader2,
  User,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const SUBJECT_CATEGORIES = [
  { id: 'general', label: 'General Inquiry', icon: HelpCircle },
  { id: 'broker', label: 'Broker API Sync', icon: Sparkles },
  { id: 'security', label: 'Security & 2FA', icon: ShieldCheck },
  { id: 'feedback', label: 'Feedback / Feature', icon: MessageSquare },
];

export default function ContactSupportDialog() {
  const { activeModal, closeModal } = useModal();
  const { toast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const isOpen = activeModal === 'contact';

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await contactAPI.sendMessage({
        name,
        email,
        category,
        message,
      });
      toast({
        title: 'Message Dispatched',
        description: 'Thank you! Our support desk will reply within 24 hours.',
        variant: 'success',
      });
      setMessage('');
      closeModal();
    } catch (error) {
      toast({
        title: 'Dispatch Failed',
        description:
          error.message || 'Unable to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const footerRightContent = (
    <span className='text-[11px] font-mono text-muted-foreground/60'>
      256-Bit TLS Encrypted Support
    </span>
  );

  return (
    <BaseDialog
      open={isOpen}
      onClose={closeModal}
      maxWidth='max-w-xl'
      badgeText='Support Desk'
      badgeVariant='secondary'
      title='Contact Support Desk'
      titleIcon={Mail}
      titleIconClassName='text-emerald-500'
      description='Have a question, feedback, or need broker synchronization support? Drop us a note below.'
      footerRight={footerRightContent}
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Category Selector Pills */}
        <div className='space-y-1.5 text-left'>
          <label className='text-xs font-semibold text-foreground/80 ml-0.5'>
            Select Inquiry Type
          </label>
          <Tabs value={category} onValueChange={setCategory} className='w-full'>
            <TabsList className='grid grid-cols-2 gap-2 h-auto p-0 bg-transparent border-0 shadow-none'>
              {SUBJECT_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className='flex items-center justify-start gap-2 p-2.5 rounded-xl border border-border/40 text-xs font-semibold data-[state=active]:bg-emerald-500/10 data-[state=active]:border-emerald-500/40 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-150 text-left shadow-none cursor-pointer'
                  >
                    <CatIcon className='size-3.5 shrink-0' />
                    <span className='truncate'>{cat.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <InsetFormCard>
          <InsetFormRow label='Your Name' icon={User}>
            <InsetTextInput
              id='contact-name'
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. Urva Gandhi'
            />
          </InsetFormRow>

          <InsetFormRow
            label='Return Email'
            icon={Mail}
            status={email ? <EmailValidationBadge value={email} /> : null}
          >
            <InsetEmailInput
              id='contact-email'
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='urva@example.com'
            />
          </InsetFormRow>

          <InsetTextareaRow
            label='Your Message'
            icon={Mail}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder='Describe your question or issue in detail...'
            maxLength={1000}
            rows={5}
          />
        </InsetFormCard>

        {/* Submit Action */}
        <div className='pt-2'>
          <Button
            type='submit'
            disabled={isSubmitting || !message.trim()}
            className='w-full rounded-xl py-5 text-xs sm:text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='size-4 animate-spin' />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className='size-4' />
                <span>Send Message</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}

export const ContactDialog = ContactSupportDialog;
export const ContactModal = ContactSupportDialog;
