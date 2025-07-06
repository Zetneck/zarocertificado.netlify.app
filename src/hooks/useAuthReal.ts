import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextReal';

export function useAuthReal() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthReal debe ser usado dentro de un AuthProvider');
  }
  return context;
}
