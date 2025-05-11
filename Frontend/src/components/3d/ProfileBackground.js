import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles that move gently
const Particles = ({ count = 100, color = '#ffffff' }) => {
  const mesh = useRef();
  
  // Create particle positions and speeds
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 10;
      const speed = 0.01 + Math.random() / 200;
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      const z = Math.random() * 2 - 1;
      
      temp.push({ time, factor, speed, x, y, z, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);
  
  // Create particle geometry
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = particles[i].x;
      positions[i3 + 1] = particles[i].y;
      positions[i3 + 2] = particles[i].z;
      scales[i] = Math.random();
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [count, particles]);
  
  // Animation for particles
  useFrame(state => {
    const time = state.clock.getElapsedTime();
    
    const positions = mesh.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update position with gentle movement
      positions[i3] += Math.sin(time * particles[i].speed * particles[i].factor) * 0.001;
      positions[i3 + 1] += Math.cos(time * particles[i].speed * particles[i].factor) * 0.001;
      positions[i3 + 2] += Math.sin(time * particles[i].speed) * 0.002;
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={mesh} geometry={particleGeo}>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
};

// Main background component with gradient effect
const ProfileBackground = () => {
  return (
    <div className="profile-background" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      background: 'linear-gradient(145deg, #050e29 0%, #1a0b2e 50%, #270a33 100%)',
      opacity: 0.85
    }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.2} />
        
        {/* Colorful particles */}
        <Particles count={150} color="#4776e6" />
        <Particles count={100} color="#8e2de2" />
        <Particles count={80} color="#ff416c" />
        
        {/* Stars in the background */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
      </Canvas>
    </div>
  );
};

export default ProfileBackground; 