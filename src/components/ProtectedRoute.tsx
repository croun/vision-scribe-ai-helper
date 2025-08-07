// src/components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginModal } from '@/components/LoginModal';
import { useState } from 'react';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(!user);

  if (!user) {
    return (
      <>
        {/* This will render the page content but with a modal overlay */}
        {children}
        <LoginModal 
          show={showModal} 
          onClose={() => setShowModal(false)} 
          redirectPath={location.pathname}
            onSuccess={() => setShowModal(false)}
        />
      </>
    );
  }

  return children;
}