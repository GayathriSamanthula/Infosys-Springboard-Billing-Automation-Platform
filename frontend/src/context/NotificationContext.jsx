import React, { createContext, useState } from 'react';
import Toast from '../components/common/Toast';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleClose = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleClose}
      />
    </NotificationContext.Provider>
  );
};
