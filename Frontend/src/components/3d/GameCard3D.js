import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Image, RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

// Single game card component in 3D
const Card = ({ game }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Animation on hover
  const { scale, rotation } = useSpring({
    scale: hovered ? [1.05, 1.05, 1.05] : [1, 1, 1],
    rotation: hovered ? [0, Math.PI / 12, 0] : [0, 0, 0],
    config: { mass: 1, tension: 170, friction: 26 }
  });

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });
  
  return (
    <animated.group
      ref={meshRef}
      scale={scale}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card base */}
      <RoundedBox args={[2, 3, 0.1]} radius={0.1} smoothness={4}>
        <meshStandardMaterial 
          color="#1e1e2f"
          metalness={0.5}
          roughness={0.4}
        />
      </RoundedBox>
      
      {/* Game cover image */}
      <group position={[0, 0.3, 0.06]}>
        <Image 
          url={game.image_url || '/images/placeholder-game.jpg'} 
          transparent
          scale={[1.8, 1.4, 1]}
        />
      </group>
      
      {/* Game info at the bottom of the card */}
      <group position={[0, -1.2, 0.08]}>
        <Html
          transform
          occlude
          distanceFactor={4}
          position={[0, 0, 0]}
          style={{
            width: '180px',
            textAlign: 'center',
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'none'
          }}
        >
          <div className="game-card-3d-info">
            <h3 style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 'bold' }}>{game.title}</h3>
            <p style={{ margin: '0', opacity: '0.8' }}>{game.platform}</p>
            <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#4776e6' }}>${game.price}</p>
          </div>
        </Html>
      </group>
    </animated.group>
  );
};

// Main component that renders a 3D game card
const GameCard3D = ({ game }) => {
  return (
    <div style={{ width: '100%', height: '300px', margin: '15px 0' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Card game={game} />
      </Canvas>
    </div>
  );
};

export default GameCard3D; 