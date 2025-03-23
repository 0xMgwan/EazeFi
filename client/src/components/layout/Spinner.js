import React from 'react';

const Spinner = ({ size = 'md' }) => {
  const sizeClass = 
    size === 'sm' ? 'h-5 w-5' : 
    size === 'lg' ? 'h-16 w-16' : 
    'h-10 w-10'; // md is default
    
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClass} border-t-2 border-b-2 border-blue-500`}></div>
    </div>
  );
};

export default Spinner;
