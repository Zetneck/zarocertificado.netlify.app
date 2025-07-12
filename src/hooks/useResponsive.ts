import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Verificar si estamos en el cliente (no SSR)
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width < 600,
      isTablet: width >= 600 && width < 1024,
      isDesktop: width >= 1024,
      width
    };
  });

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width < 600,
        isTablet: width >= 600 && width < 1024,
        isDesktop: width >= 1024,
        width
      });
    };

    // Ejecutar inmediatamente para obtener el tamaño inicial correcto
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}
