'use client';

import { useEffect } from 'react';
import { initFluid } from 'smokey-fluid-cursor';
import LandingPage from '../app/components/LandingPage';

export default function Home() {
  useEffect(() => {
    // Initialize the fluid background effect
    const cleanup = initFluid({
      id: 'smokey-fluid-canvas',
      simResolution: 128,
      dyeResolution: 512,
      densityDissipation: 0.98,
      velocityDissipation: 0.98,
      pressureIteration: 10,
      curl: 30,
      splatRadius: 0.25,
      splatForce: 6000,
      shading: true,
      colorUpdateSpeed: 0.5,
      transparent: true,
    });

    // Cleanup function to remove the effect when component unmounts
    return cleanup;
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fluid Background Canvas */}
      <canvas 
        id="smokey-fluid-canvas"
        className="fixed inset-0 w-full h-full -z-10"
        style={{
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none', // Allow clicks to pass through
        }}
      />
      
      {/* Your Landing Page Content */}
      <div className="relative z-10">
        <LandingPage />
      </div>
    </div>
  );
}