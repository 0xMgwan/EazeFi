import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletContext } from '../../context/WalletContext';

const CreateFamilyPool = () => {
  const navigate = useNavigate();
  const { wallet, loading } = useContext(WalletContext);
  
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
    
    if (!formData.initialContribution) {
      newErrors.initialContribution = 'Initial contribution is required';
    } else if (isNaN(formData.initialContribution) || parseFloat(formData.initialContribution) <= 0) {
      newErrors.initialContribution = 'Must be a positive number';
    }
    
    if (!formData.withdrawalLimit) {
      newErrors.withdrawalLimit = 'Withdrawal limit is required';
    } else if (isNaN(formData.withdrawalLimit) || parseFloat(formData.withdrawalLimit) <= 0) {
      newErrors.withdrawalLimit = 'Must be a positive number';
    }
    
    // Validate members
    const memberErrors = [];
    let hasErrors = false;
    
    formData.members.forEach((member, index) => {
      const memberError = {};
      
      if (!member.email.trim()) {
        memberError.email = 'Email is required';
        hasErrors = true;
      } else if (!/\S+@\S+\.\S+/.test(member.email)) {
        memberError.email = 'Invalid email format';
        hasErrors = true;
      }
      
      memberErrors[index] = memberError;
    });
    
    if (hasErrors) {
      newErrors.members = memberErrors;
    }
    
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
      // Check if wallet is connected
      if (!wallet) {
        navigate('/connect-wallet');
        return;
      }
      
      // Here you would call your API to create the family pool
      // For demo purposes, we'll just simulate a successful creation
      
      setTimeout(() => {
        // Redirect to the family pools page
        navigate('/family-pools');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating family pool:', error);
      setErrors({ submit: 'Failed to create family pool. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Family Pool</h1>
        <Link to="/family-pools" className="text-blue-500 hover:text-blue-700">
          Back to Family Pools
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {errors.submit}
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pool Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Pool Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Family Emergency Fund"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="token">
                  Token
                </label>
                <select
                  id="token"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Describe the purpose of this pool..."
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contribution & Withdrawal Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="initialContribution">
                  Initial Contribution (USDC)*
                </label>
                <input
                  type="number"
                  id="initialContribution"
                  name="initialContribution"
                  value={formData.initialContribution}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.initialContribution ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="100"
                  min="0"
                  step="0.01"
                />
                {errors.initialContribution && <p className="text-red-500 text-sm mt-1">{errors.initialContribution}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="withdrawalLimit">
                  Withdrawal Limit (USDC)*
                </label>
                <input
                  type="number"
                  id="withdrawalLimit"
                  name="withdrawalLimit"
                  value={formData.withdrawalLimit}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.withdrawalLimit ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="50"
                  min="0"
                  step="0.01"
                />
                {errors.withdrawalLimit && <p className="text-red-500 text-sm mt-1">{errors.withdrawalLimit}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="withdrawalPeriod">
                  Withdrawal Period
                </label>
                <select
                  id="withdrawalPeriod"
                  name="withdrawalPeriod"
                  value={formData.withdrawalPeriod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Members</h2>
              <button
                type="button"
                onClick={addMember}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Member
              </button>
            </div>
            
            {formData.members.map((member, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">Member {index + 1}</h3>
                  {formData.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor={`member-email-${index}`}>
                      Email*
                    </label>
                    <input
                      type="email"
                      id={`member-email-${index}`}
                      name="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, e)}
                      className={`w-full p-3 border rounded-lg ${
                        errors.members && errors.members[index]?.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="member@example.com"
                    />
                    {errors.members && errors.members[index]?.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.members[index].email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor={`member-role-${index}`}>
                      Role
                    </label>
                    <select
                      id={`member-role-${index}`}
                      name="role"
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, e)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Link
              to="/family-pools"
              className="px-6 py-3 mr-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFamilyPool;
