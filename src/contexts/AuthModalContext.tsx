import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthModalContextType {
  isOpen: boolean;
  mode: 'login' | 'signup';
  open: (mode?: 'login' | 'signup') => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const open = (newMode: 'login' | 'signup' = 'login') => {
    console.log('🔓 Auth modal opening with mode:', newMode);
    setMode(newMode);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, open, close }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
