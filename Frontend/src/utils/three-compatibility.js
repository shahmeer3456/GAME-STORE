/**
 * Three.js Compatibility Layer
 * 
 * This file provides a centralized place for all Three.js compatibility fixes
 * to ensure proper operation with different versions and libraries.
 */

import * as THREE from 'three';

// Fix property descriptors for key Three.js objects
export function applyCompatibilityFixes() {
  console.log('Applying Three.js compatibility fixes...');
  
  // Fix Object3D for meshes
  patchObjectPrototype(THREE.Object3D);
  
  // Fix Mesh specifically 
  patchObjectPrototype(THREE.Mesh);
  
  // Fix for Text components that extend Mesh
  if (typeof window !== 'undefined' && window !== null) {
    try {
      // Keep a reference to the original defineProperty
      const originalDefineProperty = Object.defineProperty;
      
      // Override defineProperty to ensure proper descriptors
      Object.defineProperty = function(obj, prop, descriptor) {
        // First call the original
        try {
          return originalDefineProperty.call(this, obj, prop, descriptor);
        } catch (e) {
          // If it's trying to set a property that has only getters,
          // create a hidden backing field and new accessors
          if (obj && (
              prop === 'customDepthMaterial' || 
              prop === 'customDistanceMaterial' ||
              prop === 'material'
            )) {
            
            const backingField = `_${prop}_compat`;
            obj[backingField] = descriptor.value || null;
            
            try {
              // Create a new accessor that uses our backing field
              return originalDefineProperty.call(this, obj, prop, {
                get: function() { return this[backingField]; },
                set: function(v) { this[backingField] = v; },
                configurable: true,
                enumerable: true
              });
            } catch (err) {
              // If we still can't define the property, just assign it directly
              console.warn(`Directly assigning ${prop} property:`, err);
              obj[prop] = descriptor.value || null;
              return obj;
            }
          }
          
          // Just ignore the error and return the object as is
          console.warn(`Ignored error setting ${prop}:`, e.message);
          return obj;
        }
      };
    } catch (e) {
      console.warn('Failed to patch Object.defineProperty:', e);
    }
    
    // Skip troika text patches as they cause more issues than they solve
    // applyTroikaTextPatches();
  }
  
  console.log('Three.js compatibility fixes applied.');
}

// Helper function to patch object prototypes
function patchObjectPrototype(Constructor) {
  if (!Constructor || Constructor._compatibilityPatched) {
    return;
  }
  
  try {
    // Save original constructor
    const originalConstructor = Constructor.prototype.constructor;
    
    // Create new constructor
    Constructor.prototype.constructor = function() {
      // Call original constructor
      const result = originalConstructor.apply(this, arguments);
      
      // Add compatibility properties
      if (this) {
        // Create backing fields for problematic properties
        this._customDepthMaterial = null;
        this._customDistanceMaterial = null;
        
        // Ensure we only patch once
        this._compatibilityPatched = true;
      }
      
      return result;
    };
    
    // Mark as patched
    Constructor._compatibilityPatched = true;
  } catch (e) {
    console.warn('Failed to patch constructor:', e);
  }
}

// Helper function to watch for troika-three-text loading and apply patches
function applyTroikaTextPatches() {
  // Add global variable to store Text reference
  window._compatTroikaTextPatched = false;
  
  // Create a MutationObserver to watch for script loading
  const observer = new MutationObserver((mutations) => {
    if (window._compatTroikaTextPatched) return;
    
    // Check if any Text component is loaded
    if (typeof window.troika !== 'undefined' || 
        document.querySelector('script[src*="troika"]')) {
      
      // Mark as patched to avoid re-patching
      window._compatTroikaTextPatched = true;
      console.log('Applying troika-text compatibility patches');
      
      // Force apply material patches to all meshes
      setTimeout(() => {
        try {
          // Try to find the Text constructor
          const textClass = Object.values(require.cache).find(
            module => module.exports && 
                     module.exports.Text && 
                     module.exports.Text.prototype
          )?.exports?.Text;
          
          if (textClass && textClass.prototype) {
            console.log('Found troika Text class, applying patches');
            
            // Add the necessary properties
            const proto = textClass.prototype;
            
            // Create storage for depth materials
            proto._customDepthMaterial = null;
            proto._customDistanceMaterial = null;
            
            // Override constructor to ensure properties are set
            const origInit = proto.constructor;
            proto.constructor = function() {
              const result = origInit.apply(this, arguments);
              this._customDepthMaterial = null;
              this._customDistanceMaterial = null;
              return result;
            };
          }
        } catch (e) {
          console.warn('Failed to patch troika-three-text:', e);
        }
      }, 500);
    }
  });
  
  // Start observing
  observer.observe(document, { 
    childList: true, 
    subtree: true 
  });
}

// Export the compatibility layer
export default {
  applyCompatibilityFixes
}; 