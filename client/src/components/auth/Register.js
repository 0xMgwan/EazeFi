import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Register = () => {
  const { register, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    phone: '',
    country: '',
    nationalId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { name, email, password, password2, phone, country, nationalId } = formData;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
    
    // Calculate password strength if password field is being updated
    if (e.target.name === 'password') {
      calculatePasswordStrength(e.target.value);
    }
  };
  
  // Function to calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!name) {
      errors.name = 'Name is required';
    }
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      errors.password = 'Password must include uppercase, lowercase, number and special character';
    }
    
    if (password !== password2) {
      errors.password2 = 'Passwords do not match';
    }
    
    if (!phone) {
      errors.phone = 'Phone number is required';
    }
    
    if (!country) {
      errors.country = 'Country is required';
    }
    
    if (!nationalId) {
      errors.nationalId = 'National ID is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      const success = await register({
        name,
        email,
        password,
        phone,
        country,
        nationalId
      });
      setIsSubmitting(false);
      
      if (success) {
        navigate('/dashboard');
      }
    }
  };

  // List of countries for dropdown
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Spain', 'Italy', 'Japan', 'China', 'India', 'Brazil', 
    'Mexico', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 
    'Uganda', 'Rwanda', 'Ethiopia', 'Egypt', 'Morocco', 'UAE', 'Saudi Arabia'
  ];

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
          
          {error && error.map((err, index) => (
            <div key={index} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{err.msg}</span>
            </div>
          ))}
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="name"
                type="text"
                placeholder="Full Name"
                name="name"
                value={name}
                onChange={onChange}
              />
              {formErrors.name && <p className="text-red-500 text-xs italic mt-1">{formErrors.name}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="email"
                type="email"
                placeholder="Email"
                name="email"
                value={email}
                onChange={onChange}
              />
              {formErrors.email && <p className="text-red-500 text-xs italic mt-1">{formErrors.email}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="password"
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
              />
              {formErrors.password && <p className="text-red-500 text-xs italic mt-1">{formErrors.password}</p>}
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex mb-1">
                    <div className={`h-2 rounded-full flex-1 mr-1 ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 rounded-full flex-1 mr-1 ${passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 rounded-full flex-1 mr-1 ${passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 rounded-full flex-1 mr-1 ${passwordStrength >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 rounded-full flex-1 ${passwordStrength >= 5 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password strength: {' '}
                    {passwordStrength === 0 && <span className="text-gray-500">Very weak</span>}
                    {passwordStrength === 1 && <span className="text-red-500">Weak</span>}
                    {passwordStrength === 2 && <span className="text-orange-500">Fair</span>}
                    {passwordStrength === 3 && <span className="text-yellow-500">Good</span>}
                    {passwordStrength === 4 && <span className="text-blue-500">Strong</span>}
                    {passwordStrength === 5 && <span className="text-green-500">Very strong</span>}
                  </p>
                </div>
              )}
              
              <ul className="text-xs text-gray-500 mt-2 list-disc pl-5">
                <li className={password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>At least one uppercase letter</li>
                <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>At least one lowercase letter</li>
                <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>At least one number</li>
                <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}>At least one special character</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password2">
                Confirm Password
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.password2 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="password2"
                type="password"
                placeholder="Confirm Password"
                name="password2"
                value={password2}
                onChange={onChange}
              />
              {formErrors.password2 && <p className="text-red-500 text-xs italic mt-1">{formErrors.password2}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="phone"
                type="tel"
                placeholder="Phone Number"
                name="phone"
                value={phone}
                onChange={onChange}
              />
              {formErrors.phone && <p className="text-red-500 text-xs italic mt-1">{formErrors.phone}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                Country
              </label>
              <select
                className={`shadow appearance-none border ${formErrors.country ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="country"
                name="country"
                value={country}
                onChange={onChange}
              >
                <option value="">Select Country</option>
                {countries.map((c, index) => (
                  <option key={index} value={c}>{c}</option>
                ))}
              </select>
              {formErrors.country && <p className="text-red-500 text-xs italic mt-1">{formErrors.country}</p>}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nationalId">
                National ID Number
              </label>
              <input
                className={`shadow appearance-none border ${formErrors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                id="nationalId"
                type="text"
                placeholder="National ID Number"
                name="nationalId"
                value={nationalId}
                onChange={onChange}
              />
              {formErrors.nationalId && <p className="text-red-500 text-xs italic mt-1">{formErrors.nationalId}</p>}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-500 hover:text-blue-700">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
