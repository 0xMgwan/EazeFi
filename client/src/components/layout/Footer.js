import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">EazeFi</h3>
            <p className="text-gray-300">
              A Stellar-based platform that enables anyone around the world to send tokenized mobile money instantly across borders.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/swap" className="text-gray-300 hover:text-white">
                  Swap
                </Link>
              </li>
              <li>
                <Link to="/send-money" className="text-gray-300 hover:text-white">
                  Send Money
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://developers.stellar.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-white"
                >
                  Stellar Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://soroban.stellar.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-white"
                >
                  Soroban Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/0xMgwan/EazeFi" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-white"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://laboratory.stellar.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-white"
                >
                  Stellar Laboratory
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/0xMgwan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-300 hover:text-white text-2xl"
              >
                <FaGithub />
              </a>
              <a 
                href="https://twitter.com/0xMgwan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-300 hover:text-white text-2xl"
              >
                <FaTwitter />
              </a>
              <a 
                href="https://linkedin.com/in/davidmachuche" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-300 hover:text-white text-2xl"
              >
                <FaLinkedin />
              </a>
              <a 
                href="mailto:contact@eazefi.com" 
                className="text-gray-300 hover:text-white text-2xl"
              >
                <FaEnvelope />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-gray-300">
                Have questions or feedback? <br />
                <a 
                  href="mailto:contact@eazefi.com" 
                  className="text-blue-400 hover:text-blue-300"
                >
                  contact@eazefi.com
                </a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400">
            &copy; {year} EazeFi. All rights reserved. Built by <a 
              href="https://github.com/0xMgwan" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300"
            >
              David Machuche
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
