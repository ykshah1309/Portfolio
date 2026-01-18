'use client';

import { useEffect } from 'react';
import { initFluid } from 'smokey-fluid-cursor';

interface FluidBackgroundProps {
  faded?: boolean;
}

export default function FluidBackground({ faded = false }: FluidBackgroundProps) {
  useEffect(() => {
    // Initialize the fluid effect with your preferred config
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const cleanup = initFluid({
      id: 'smokey-fluid-canvas',
      simResolution: isMobile ? 128 : 256,
      dyeResolution: isMobile ? 512 : 1024,
      densityDissipation: 0.98,
      velocityDissipation: 0.98,
      pressureIteration: isMobile ? 10 : 20,
      curl: 35,
      splatRadius: 0.25,
      splatForce: 6000,
      shading: true,
      colorUpdateSpeed: 10,
      transparent: true,
    });

    // Cleanup function to destroy the effect on component unmount
    return cleanup;
  }, []);

  // The package automatically creates and manages its own canvas
  // You just need to provide a placeholder
  return (
    <div 
      className={`fixed inset-0 -z-10 pointer-events-none transition-opacity duration-1000 ${faded ? 'opacity-30' : 'opacity-100'}`}
    >
      <canvas 
        id="smokey-fluid-canvas" 
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          touchAction: 'none',
        }}
      />
    </div>
  );
}