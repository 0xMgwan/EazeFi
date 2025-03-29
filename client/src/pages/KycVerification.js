import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const KycVerification = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dateOfBirth: '',
    idType: 'passport',
    idNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: user?.country || '',
    idFrontImage: null,
    idBackImage: null,
    selfieImage: null
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };
  
  const nextStep = () => {
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would upload the files to a server
      // and update the user's KYC status in the database
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user profile with pending KYC status
      await updateProfile({ ...user, kycStatus: 'pending' });
      
      // Navigate to profile page
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting KYC verification:', error);
      alert('There was an error submitting your verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Identity Verification</h1>
        <p className="text-gray-600 mb-8">Complete the verification process to unlock all features of EazeFi</p>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">Personal Information</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">ID Verification</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">Review & Submit</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                    Full Legal Name
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="As it appears on your ID"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                    City
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="city"
                    name="city"
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postalCode">
                    Postal Code
                  </label>
                  <input
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    placeholder="Postal code"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                    Country
                  </label>
                  <select
                    className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
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
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: ID Verification */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">ID Verification</h2>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idType">
                  ID Type
                </label>
                <select
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  required
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idNumber">
                  ID Number
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="idNumber"
                  name="idNumber"
                  type="text"
                  placeholder="Enter your ID number"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idFrontImage">
                    Front of ID
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="idFrontImage" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input id="idFrontImage" name="idFrontImage" type="file" className="sr-only" onChange={handleFileChange} required />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                  {formData.idFrontImage && (
                    <p className="mt-2 text-sm text-green-600">
                      File selected: {formData.idFrontImage.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idBackImage">
                    Back of ID
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="idBackImage" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input id="idBackImage" name="idBackImage" type="file" className="sr-only" onChange={handleFileChange} required />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                  {formData.idBackImage && (
                    <p className="mt-2 text-sm text-green-600">
                      File selected: {formData.idBackImage.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selfieImage">
                  Selfie with ID
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="selfieImage" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="selfieImage" name="selfieImage" type="file" className="sr-only" onChange={handleFileChange} required />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {formData.selfieImage && (
                  <p className="mt-2 text-sm text-green-600">
                    File selected: {formData.selfieImage.name}
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  Previous Step
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Review & Submit</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{formData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{formData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{formData.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Postal Code</p>
                    <p className="font-medium">{formData.postalCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{formData.country}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">ID Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Type</p>
                    <p className="font-medium">
                      {formData.idType === 'passport' ? 'Passport' : 
                       formData.idType === 'national_id' ? 'National ID' : 
                       'Driver\'s License'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{formData.idNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Front of ID</p>
                    <p className="font-medium text-green-600">
                      {formData.idFrontImage ? '✓ Uploaded' : '✗ Missing'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Back of ID</p>
                    <p className="font-medium text-green-600">
                      {formData.idBackImage ? '✓ Uploaded' : '✗ Missing'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Selfie with ID</p>
                    <p className="font-medium text-green-600">
                      {formData.selfieImage ? '✓ Uploaded' : '✗ Missing'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                <h3 className="font-medium">Important Information</h3>
                <p className="text-sm mt-1">
                  By submitting this form, you confirm that all information provided is accurate and authentic. 
                  Providing false information may result in account suspension and legal consequences.
                </p>
                <p className="text-sm mt-2">
                  Your verification will be processed within 1-2 business days. You will receive an email 
                  notification once the verification is complete.
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                    I confirm that all information provided is accurate and I agree to the 
                    <a href="/terms" className="text-blue-600 hover:text-blue-500"> Terms of Service</a> and 
                    <a href="/privacy" className="text-blue-600 hover:text-blue-500"> Privacy Policy</a>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  Previous Step
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
                      Submitting...
                    </span>
                  ) : (
                    'Submit Verification'
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

export default KycVerification;
