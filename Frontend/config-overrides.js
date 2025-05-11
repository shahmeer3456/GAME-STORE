const path = require('path');

module.exports = function override(config, env) {
  // Basic alias for ShaderChunk which is needed
  config.resolve.alias = {
    ...config.resolve.alias,
    'three/src/renderers/shaders/ShaderChunk': path.resolve(
      __dirname,
      'node_modules/three/src/renderers/shaders/ShaderChunk.js'
    )
  };
  
  // Add Webpack plugins to provide shader modules when requested
  if (!config.plugins) {
    config.plugins = [];
  }
  
  // Use ProvidePlugin to make ShaderChunk and ShaderLib available
  config.plugins.push(
    new (require('webpack').ProvidePlugin)({
      ShaderChunk: ['three/src/renderers/shaders/ShaderChunk', 'default'],
      ShaderLib: ['src/utils/fix-shader-chunk', 'ShaderLib']
    })
  );

  return config;
};

module.exports = {
  devServer: function(configFunction) {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      
      // Fix for allowedHosts issue
      config.allowedHosts = 'all';
      
      return config;
    };
  }
}; 