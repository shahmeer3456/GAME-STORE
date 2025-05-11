import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated && user?.role === 'admin' ? (
    children
  ) : (
    <Navigate to="/" />
  );
};

export default AdminRoute; 