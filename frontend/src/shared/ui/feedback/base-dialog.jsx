'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/primitives/dialog';
import { Badge } from '@/shared/ui/primitives/badge';
import Image from 'next/image';
import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

export function BaseDialog({
  open,
  onClose,
  maxWidth = 'max-w-xl',
  badgeText,
  badgeVariant = 'secondary',
  badgeIcon: BadgeIcon,
  title,
  titleIcon: TitleIcon,
  titleIconClassName = 'text-emerald-500',
  description,
  headerExtra,
  subheader,
  children,
  footerRight,
  footerLeft,
  className,
}) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose?.()}>
      <DialogContent
        className={cn(
          maxWidth,
          'max-h-[92vh] sm:max-h-[88vh] p-0 overflow-hidden bg-card/95 backdrop-blur-2xl text-card-foreground border border-border/50 shadow-2xl rounded-[24px] flex flex-col gap-0',
          className
        )}
      >
        {/* Top Brand Header Bar */}
        <DialogHeader className='p-6 pb-4 border-b border-border/40 bg-muted/20 flex flex-col gap-2.5 shrink-0 text-left pr-14 sm:pr-16'>
          <div className='flex flex-wrap items-center justify-between gap-2.5'>
            <div className='flex items-center gap-2.5'>
              <span className='relative size-6 block shrink-0'>
                <Image
                  src='/coinTrack.png'
                  alt='coinTrack'
                  width={24}
                  height={24}
                  className='object-contain w-auto h-auto'
                />
              </span>
              {badgeText && (
                <Badge
                  variant={badgeVariant}
                  className='gap-1 font-sans text-xs'
                >
                  {BadgeIcon && <BadgeIcon className='size-3 shrink-0' />}
                  <span>{badgeText}</span>
                </Badge>
              )}
            </div>
          </div>

          {title && (
            <DialogTitle className='font-sans font-bold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5 tracking-tight'>
              {TitleIcon && (
                <TitleIcon
                  className={cn('size-6 shrink-0', titleIconClassName)}
                  aria-hidden='true'
                />
              )}
              <span>{title}</span>
            </DialogTitle>
          )}

          {description && (
            <DialogDescription className='text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed'>
              {description}
            </DialogDescription>
          )}

          {headerExtra && <div className='pt-1'>{headerExtra}</div>}
        </DialogHeader>

        {/* Optional Subheader (Search bar, metadata tags, etc.) */}
        {subheader && (
          <div className='px-6 py-2.5 border-b border-border/30 bg-muted/10 flex flex-wrap items-center justify-between gap-3 shrink-0'>
            {subheader}
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className='p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 scrollbar-thin space-y-4'>
          {children}
        </div>

        {/* Standard Brand Footer */}
        <div className='border-t border-border/40 bg-muted/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 rounded-b-[24px]'>
          {footerLeft ?? (
            <div className='text-xs text-muted-foreground font-sans'>
              © {currentYear}{' '}
              <span className='font-semibold text-foreground'>coinTrack</span> ·
              All Rights Reserved
            </div>
          )}
          {footerRight}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BaseDialog;

