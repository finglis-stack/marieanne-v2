"use client";

import React, { useEffect, useState } from 'react';
import { createCanaryToken, isCanaryToken, triggerCanaryAlert } from '@/lib/honeypot';

interface CanaryTokenInjectorProps {
  location: string;
}

export const CanaryTokenInjector = ({ location }: CanaryTokenInjectorProps) => {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const initToken = async () => {
      const newToken = await createCanaryToken(location);
      setToken(newToken);
    };
    initToken();
  }, [location]);

  useEffect(() => {
    if (!token) return;

    // Intercepter les tentatives d'accès au token
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Quelqu'un essaie de modifier le DOM = suspect
          checkForSuspiciousActivity();
        }
      });
    });

    const element = document.getElementById('canary-token');
    if (element) {
      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [token]);

  const checkForSuspiciousActivity = async () => {
    if (await isCanaryToken(token)) {
      await triggerCanaryAlert(token, location);
    }
  };

  // Token invisible dans le DOM
  return (
    <div 
      id="canary-token" 
      data-token={token}
      style={{ 
        display: 'none',
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {token}
    </div>
  );
};