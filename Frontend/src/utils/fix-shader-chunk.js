// Import directly from Three.js
import { ShaderChunk } from 'three/src/renderers/shaders/ShaderChunk';
import { ShaderLib } from 'three';

// Make ShaderChunk and ShaderLib globally available
if (typeof window !== 'undefined' && window !== null) {
  try {
    window.ShaderChunk = ShaderChunk;
    window.ShaderLib = ShaderLib;
    console.log('Shader chunks registered successfully');
  } catch (error) {
    console.warn('Failed to register shader chunks:', error);
  }
}

// Export ShaderChunk and ShaderLib
export default ShaderChunk;
export { ShaderLib }; 