import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-blue-600 text-9xl font-bold mb-4">404</div>
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-lg">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Link
          to="/"
          className="bg-blue-600 text-white hover:bg-blue-700 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center"
        >
          <FaHome className="mr-2" /> Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center"
        >
          <FaArrowLeft className="mr-2" /> Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
