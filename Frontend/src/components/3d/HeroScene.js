import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, PerspectiveCamera } from '@react-three/drei';
import GameConsole from './GameConsole';
import './HeroScene.css';

const HeroScene = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollPosition = window.scrollY;
        const heroHeight = window.innerHeight;
        
        // Adjust opacity based on scroll position
        if (scrollPosition > 50) {
          const opacity = Math.max(1 - scrollPosition / (heroHeight / 1.5), 0.1);
          heroRef.current.style.opacity = opacity;
          
          // Add scrolled class to help with styling
          heroRef.current.classList.add('scrolled');
        } else {
          heroRef.current.style.opacity = 1;
          heroRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="hero-scene" ref={heroRef}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />
        
        {/* Environment and Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.7} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff416c" />
        
        {/* 3D Models */}
        <Suspense fallback={null}>
          <GameConsole position={[0, -0.5, 0]} scale={0.7} rotation={[0, Math.PI / 6, 0]} />
          <Environment preset="night" />
        </Suspense>
        
        {/* Stars background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Simplified controls - no user interaction */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          enableRotate={false}
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

export default HeroScene;
