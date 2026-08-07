import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

const SSOCallback = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting...</p>
      <div className="hidden">
        <AuthenticateWithRedirectCallback 
          signInForceRedirectUrl="/sync-user" 
          signUpForceRedirectUrl="/sync-user" 
        />
      </div>
    </div>
  );
};

export default SSOCallback;
