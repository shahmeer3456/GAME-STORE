import React from 'react';
import useApiConnection from '../hooks/useApiConnection';
import './ApiStatus.css'; // We'll create this file next

const ApiStatus = ({ showDetails = false, pollInterval = 0 }) => {
  const { 
    isChecking, 
    isConnected, 
    message, 
    serverInfo, 
    checkConnection 
  } = useApiConnection(true, pollInterval);

  const getStatusClass = () => {
    if (isChecking) return 'checking';
    return isConnected ? 'online' : 'offline';
  };

  return (
    <div className="api-status">
      <div className={`status-indicator ${getStatusClass()}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {isChecking ? 'Checking API...' : (isConnected ? 'API Connected' : 'API Offline')}
        </span>
        {!isChecking && (
          <button 
            className="retry-btn" 
            onClick={checkConnection}
            title="Retry connection"
            aria-label="Retry connection"
          >
            ↻
          </button>
        )}
      </div>
      
      {showDetails && serverInfo && (
        <div className="server-info">
          <p>Version: {serverInfo.version}</p>
          <p>Status: {serverInfo.status}</p>
          <p>Last Updated: {new Date(serverInfo.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default ApiStatus; 