import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const Alert = () => {
  const [alerts, setAlerts] = useState([]);

  // This would normally be connected to a global state management system like Redux
  // For demonstration purposes, we'll use a simple timeout to show and hide alerts
  useEffect(() => {
    // Example alert for demonstration
    const demoAlert = {
      id: 'welcome',
      type: 'info',
      message: 'Welcome to EazeFi! Explore our new SDEX integration for token swapping.',
      timeout: 5000
    };
    
    setAlerts([demoAlert]);
    
    // Clean up alerts after timeout
    const timer = setTimeout(() => {
      setAlerts([]);
    }, demoAlert.timeout);
    
    return () => clearTimeout(timer);
  }, []);

  const removeAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />;
      case 'danger':
        return <FaTimesCircle className="h-5 w-5 text-red-400" />;
      case 'info':
      default:
        return <FaInfoCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getAlertClasses = (type) => {
    const baseClasses = "border-l-4 p-4 mb-4 rounded shadow-md";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-500`;
      case 'danger':
        return `${baseClasses} bg-red-50 border-red-500`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 border-blue-500`;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-2">
      {alerts.map(alert => (
        <div key={alert.id} className={getAlertClasses(alert.type)}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getAlertIcon(alert.type)}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className="text-sm leading-5 text-gray-800">
                {alert.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alert;
