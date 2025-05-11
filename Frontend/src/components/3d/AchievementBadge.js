import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';

// Single badge component
const Badge = ({ name, level = 1, color = '#4776e6' }) => {
  const badgeRef = useRef();
  
  // Different colors based on level
  const getLevelColor = (level) => {
    switch(level) {
      case 3: return '#ff416c'; // High level - pink/red
      case 2: return '#f7971e'; // Medium level - orange
      default: return color; // Default level - blue
    }
  };
  
  const badgeColor = getLevelColor(level);
  
  // Simple rotation animation
  useFrame(() => {
    if (badgeRef.current) {
      badgeRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={badgeRef}>
      {/* Badge base */}
      <RoundedBox args={[2, 0.5, 0.1]} radius={0.1} smoothness={4}>
        <meshStandardMaterial 
          color={badgeColor}
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>
      
      {/* Badge text */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        textAlign="center"
      >
        {name}
      </Text>
      
      {/* Level indicators - small spheres */}
      {[...Array(level)].map((_, i) => (
        <mesh key={i} position={[0.8 - i * 0.3, -0.15, 0.06]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
};

// Main component that renders a 3D badge
const AchievementBadge = ({ name, level }) => {
  return (
    <div style={{ width: '100%', height: '100px', margin: '10px 0' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Badge name={name} level={level} />
      </Canvas>
    </div>
  );
};

export default AchievementBadge; 