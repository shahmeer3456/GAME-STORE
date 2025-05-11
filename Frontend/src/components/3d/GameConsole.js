import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Float, Text } from '@react-three/drei';

// A basic 3D game console model (stylized)
const GameConsole = ({ position = [0, 0, 0], scale = 1 }) => {
  const groupRef = useRef();
  
  // Animate the console
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle hover animation
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Console Base */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.5, 1.5]} />
        <meshStandardMaterial color="#302b63" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Console Top */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.3, 0.1, 1.3]} />
        <meshStandardMaterial color="#24243e" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Screen */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial 
          color="#6a11cb" 
          emissive="#6a11cb"
          emissiveIntensity={0.5}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      
      {/* Buttons */}
      {[[-0.8, 0.31, -0.4], [-0.6, 0.31, -0.4], [-0.4, 0.31, -0.4], [-0.2, 0.31, -0.4]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
          <meshStandardMaterial 
            color={["#ff416c", "#ffac41", "#4776e6", "#8e54e9"][i % 4]} 
            metalness={0.3} 
            roughness={0.8} 
          />
        </mesh>
      ))}
      
      {/* D-Pad */}
      <mesh position={[0.6, 0.31, -0.4]} castShadow>
        <boxGeometry args={[0.3, 0.02, 0.3]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Joystick */}
      <mesh position={[0.6, 0.37, 0.2]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, 0.31, 0.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Text */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.3}
          color="#ff416c"
          anchorX="center"
          anchorY="middle"
        >
          GAME STORE
        </Text>
      </Float>
    </group>
  );
};

export default GameConsole; 