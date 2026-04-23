import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const isAuthenticated = Boolean(localStorage.getItem('access_token'));
  const isAdmin = Boolean(localStorage.getItem('admin_token'));

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  }, [navigate]);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }, [navigate]);

  return { isAuthenticated, isAdmin, logout, logoutAdmin };
}
