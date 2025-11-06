// src/pages/PendingConfirmation.tsx
import React from 'react';

export default function PendingConfirmation() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-foreground mb-4">Check Your Email</h1>
        <p className="text-lg text-muted-foreground mb-6">
          We've sent a verification link to your email address. Please click the link to activate your account.
        </p>
        <p className="text-sm text-muted-foreground">
          (Don't forget to check your spam folder!)
        </p>
      </div>
    </div>
  );
}
