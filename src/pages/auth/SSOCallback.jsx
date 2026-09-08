import React from 'react';
import RouteIntegrityLoader from '../../components/RouteIntegrityLoader';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

const SSOCallback = () => {
  return (
    <div className="relative min-h-screen">
      <RouteIntegrityLoader 
        title="Verifying credentials..." 
        subtitle="Connecting securely with your provider..."
      />
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
