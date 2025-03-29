import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, loading } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    language: '',
    currency: '',
    kycStatus: 'not_started', // Possible values: not_started, pending, verified, rejected
    notifications: {
      email: true,
      sms: true,
      app: true
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        language: user.language || 'en',
        currency: user.currency || 'USD',
        kycStatus: user.kycStatus || 'not_started',
        notifications: {
          email: user.notifications?.email !== false,
          sms: user.notifications?.sms !== false,
          app: user.notifications?.app !== false
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <i className="fas fa-edit mr-2"></i> Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 
          'bg-red-50 text-red-800 border-l-4 border-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <i className="fas fa-check-circle"></i>
              ) : (
                <i className="fas fa-exclamation-circle"></i>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="py-2 text-gray-800">{formData.name || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                ) : (
                  <p className="py-2 text-gray-800">{formData.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="py-2 text-gray-800">{formData.phone || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                  Country
                </label>
                {isEditing ? (
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                    <option value="TZ">Tanzania</option>
                  </select>
                ) : (
                  <p className="py-2 text-gray-800">{formData.country || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
                  Language
                </label>
                {isEditing ? (
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="sw">Swahili</option>
                  </select>
                ) : (
                  <p className="py-2 text-gray-800">
                    {formData.language === 'en' ? 'English' : 
                     formData.language === 'fr' ? 'French' : 
                     formData.language === 'es' ? 'Spanish' : 
                     formData.language === 'pt' ? 'Portuguese' : 
                     formData.language === 'sw' ? 'Swahili' : 
                     formData.language}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
                  Preferred Currency
                </label>
                {isEditing ? (
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="NGN">Nigerian Naira (NGN)</option>
                    <option value="GHS">Ghanaian Cedi (GHS)</option>
                    <option value="KES">Kenyan Shilling (KES)</option>
                    <option value="ZAR">South African Rand (ZAR)</option>
                    <option value="TZS">Tanzanian Shilling (TZS)</option>
                  </select>
                ) : (
                  <p className="py-2 text-gray-800">{formData.currency}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    name="email"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.notifications.email}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="email-notifications" className="ml-3 block text-gray-700">
                    Email Notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="sms-notifications"
                    name="sms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.notifications.sms}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="sms-notifications" className="ml-3 block text-gray-700">
                    SMS Notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="app-notifications"
                    name="app"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.notifications.app}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="app-notifications" className="ml-3 block text-gray-700">
                    In-App Notifications
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-800">
                  <span className={`inline-block w-8 text-center ${formData.notifications.email ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.notifications.email ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>}
                  </span>
                  Email Notifications
                </p>
                <p className="text-gray-800">
                  <span className={`inline-block w-8 text-center ${formData.notifications.sms ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.notifications.sms ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>}
                  </span>
                  SMS Notifications
                </p>
                <p className="text-gray-800">
                  <span className={`inline-block w-8 text-center ${formData.notifications.app ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.notifications.app ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>}
                  </span>
                  In-App Notifications
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">KYC Verification</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {formData.kycStatus === 'verified' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <i className="fas fa-check text-green-600"></i>
                    </span>
                  ) : formData.kycStatus === 'pending' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <i className="fas fa-clock text-yellow-600"></i>
                    </span>
                  ) : formData.kycStatus === 'rejected' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <i className="fas fa-times text-red-600"></i>
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <i className="fas fa-user-shield text-gray-600"></i>
                    </span>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Identity Verification
                    {formData.kycStatus === 'verified' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                    {formData.kycStatus === 'pending' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {formData.kycStatus === 'rejected' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {formData.kycStatus === 'verified' ? (
                      'Your identity has been verified. You now have full access to all features of EazeFi.'
                    ) : formData.kycStatus === 'pending' ? (
                      'Your verification is currently being processed. This usually takes 1-2 business days.'
                    ) : formData.kycStatus === 'rejected' ? (
                      'Your verification was rejected. Please review the feedback and resubmit.'
                    ) : (
                      'Complete the KYC verification process to unlock all features of EazeFi, including higher transaction limits.'
                    )}
                  </p>
                  {(formData.kycStatus === 'not_started' || formData.kycStatus === 'rejected') && (
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => window.location.href = '/kyc-verification'}
                    >
                      Start Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Account Security</h3>
                <p className="text-gray-600 text-sm mt-1">Manage your password and security settings</p>
              </div>
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
                onClick={() => {/* Handle password change */}}
              >
                Change Password
              </button>
            </div>
          </div>
          
          {isEditing && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
