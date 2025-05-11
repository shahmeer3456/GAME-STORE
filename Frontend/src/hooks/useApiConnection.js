import { useState, useEffect, useCallback } from 'react';
import connectionService from '../services/connectionService';

/**
 * Custom hook to check API connection status
 * @param {boolean} autoCheck - Whether to automatically check connection on mount
 * @param {number} pollInterval - Interval in ms to poll the API (0 to disable polling)
 * @returns {Object} API connection status and functions
 */
const useApiConnection = (autoCheck = true, pollInterval = 0) => {
  const [status, setStatus] = useState({
    checking: autoCheck,
    success: false,
    message: 'Waiting to check API connection',
    timestamp: null
  });
  const [serverInfo, setServerInfo] = useState(null);

  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const apiStatus = await connectionService.checkApiStatus();
      
      setStatus({
        checking: false,
        success: apiStatus.success,
        message: apiStatus.message,
        status: apiStatus.status,
        timestamp: new Date()
      });

      if (apiStatus.success) {
        try {
          const info = await connectionService.getServerInfo();
          setServerInfo(info);
        } catch (error) {
          console.error("Could not fetch server info:", error);
        }
      }
      
      return apiStatus.success;
    } catch (error) {
      setStatus({
        checking: false,
        success: false,
        message: 'Failed to connect to API',
        status: 'Error',
        timestamp: new Date()
      });
      
      return false;
    }
  }, []);

  useEffect(() => {
    let intervalId;
    
    if (autoCheck) {
      // Initial check
      checkConnection();
      
      // Set up polling if interval is greater than 0
      if (pollInterval > 0) {
        intervalId = setInterval(checkConnection, pollInterval);
      }
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoCheck, pollInterval, checkConnection]);

  return {
    isChecking: status.checking,
    isConnected: status.success,
    message: status.message,
    statusCode: status.status,
    lastChecked: status.timestamp,
    serverInfo,
    checkConnection
  };
};

export default useApiConnection; 