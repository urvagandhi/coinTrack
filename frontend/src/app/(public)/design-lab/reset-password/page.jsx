import { Suspense } from 'react';
import DesignLabResetPasswordClient from './client';

export const metadata = {
  title: 'Design Lab - Reset Password',
};

export default function DesignLabResetPasswordPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background' />}>
      <DesignLabResetPasswordClient />
    </Suspense>
  );
}
