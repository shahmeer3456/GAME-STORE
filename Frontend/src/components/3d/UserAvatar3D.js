import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

// Avatar model component
const Avatar = ({ username }) => {
  const meshRef = useRef();
  const initialLetter = username ? username.charAt(0).toUpperCase() : 'U';
  
  // Generate color based on username
  const getColorFromUsername = (name) => {
    const colors = [
      '#ff416c', // pink
      '#4776e6', // blue
      '#8e2de2', // purple
      '#f7971e', // orange
      '#11998e', // teal
    ];
    
    // Simple hash function to pick a color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const avatarColor = getColorFromUsername(username || 'User');
  
  // Animate avatar on hover
  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 180, friction: 12 }
  }));
  
  // Animation effect
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });
  
  return (
    <animated.group {...spring} ref={meshRef}>
      {/* Base sphere for avatar */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={avatarColor} 
          metalness={0.5} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Text for initial letter */}
      <Text
        position={[0, 0, 1.1]}
        fontSize={0.8}
        color="#ffffff"
        font="/fonts/Inter-Bold.woff"
        anchorX="center"
        anchorY="middle"
      >
        {initialLetter}
      </Text>
      
      {/* Glow effect */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color={avatarColor} 
          transparent={true} 
          opacity={0.2} 
        />
      </mesh>
    </animated.group>
  );
};

// Main component to export
const UserAvatar3D = ({ username }) => {
  return (
    <div className="user-avatar-3d" style={{ width: '100%', height: '180px' }}>
      <Canvas>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Avatar */}
        <Avatar username={username} />
        
        {/* Environment and controls */}
        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
};

export default UserAvatar3D; 