import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WalletContext from '../../context/WalletContext';

const CreateFamilyPool = () => {
  const navigate = useNavigate();
  const { createFamilyPool, loading } = useContext(WalletContext);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    token: 'USDC',
    initialContribution: '',
    withdrawalLimit: '',
    withdrawalPeriod: 'monthly',
    members: [{ email: '', role: 'member' }]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...formData.members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
    
    // Clear member error
    if (errors[`members.${index}.${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`members.${index}.${name}`]: null
      }));
    }
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { email: '', role: 'member' }]
    }));
  };

  const removeMember = (index) => {
    if (formData.members.length > 1) {
      const updatedMembers = [...formData.members];
      updatedMembers.splice(index, 1);
      
      setFormData(prev => ({
        ...prev,
        members: updatedMembers
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Pool name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.initialContribution || parseFloat(formData.initialContribution) <= 0) {
      newErrors.initialContribution = 'Initial contribution must be greater than 0';
    }
    
    if (!formData.withdrawalLimit || parseFloat(formData.withdrawalLimit) <= 0) {
      newErrors.withdrawalLimit = 'Withdrawal limit must be greater than 0';
    }
    
    // Validate members
    formData.members.forEach((member, index) => {
      if (!member.email.trim()) {
        newErrors[`members.${index}.email`] = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(member.email)) {
        newErrors[`members.${index}.email`] = 'Email is invalid';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createFamilyPool(formData);
      navigate('/family-pools');
    } catch (err) {
      console.error('Error creating family pool:', err);
      setErrors(prev => ({
        ...prev,
        form: 'Failed to create family pool. Please try again.'
      }));
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
      <div className="mb-6">
        <Link to="/family-pools" className="text-blue-500 hover:text-blue-700">
          <i className="fas fa-arrow-left mr-2"></i> Back to Family Pools
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Create Family Pool</h1>
          <p className="text-gray-600 mt-2">Set up a shared fund for your family members</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {errors.form && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.form}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pool Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Pool Name*
                </label>
                <input
                  className={`shadow appearance-none border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Family Emergency Fund"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="token">
                  Currency*
                </label>
                <select
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="token"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="XLM">XLM</option>
                  <option value="TSHT">TSHT (Coming Soon)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description*
                </label>
                <textarea
                  className={`shadow appearance-none border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Describe the purpose of this pool"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="initialContribution">
                  Initial Contribution ({formData.token})*
                </label>
                <input
                  className={`shadow appearance-none border ${errors.initialContribution ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  id="initialContribution"
                  name="initialContribution"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.initialContribution}
                  onChange={handleChange}
                />
                {errors.initialContribution && <p className="text-red-500 text-xs mt-1">{errors.initialContribution}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="withdrawalLimit">
                  Withdrawal Limit ({formData.token})*
                </label>
                <input
                  className={`shadow appearance-none border ${errors.withdrawalLimit ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  id="withdrawalLimit"
                  name="withdrawalLimit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.withdrawalLimit}
                  onChange={handleChange}
                />
                {errors.withdrawalLimit && <p className="text-red-500 text-xs mt-1">{errors.withdrawalLimit}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="withdrawalPeriod">
                  Withdrawal Period*
                </label>
                <select
                  className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="withdrawalPeriod"
                  name="withdrawalPeriod"
                  value={formData.withdrawalPeriod}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Family Members</h2>
              <button
                type="button"
                onClick={addMember}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-lg text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Member
              </button>
            </div>
            
            {formData.members.map((member, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">
                    {index === 0 ? 'You (Pool Creator)' : `Member ${index}`}
                  </h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`member-email-${index}`}>
                      Email*
                    </label>
                    <input
                      className={`shadow appearance-none border ${errors[`members.${index}.email`] ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                      id={`member-email-${index}`}
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, e)}
                      disabled={index === 0} // First member is the creator
                    />
                    {errors[`members.${index}.email`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`members.${index}.email`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`member-role-${index}`}>
                      Role*
                    </label>
                    <select
                      className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id={`member-role-${index}`}
                      name="role"
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, e)}
                      disabled={index === 0} // First member is always admin
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Link
              to="/family-pools"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg mr-2"
            >
              Cancel
            </Link>
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
                  Creating Pool...
                </span>
              ) : (
                'Create Pool'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFamilyPool;
