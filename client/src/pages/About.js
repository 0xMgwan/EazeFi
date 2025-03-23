import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-blue-700">About EazeFi</h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Revolutionizing cross-border payments with blockchain technology to make global remittances faster, cheaper, and more accessible.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At EazeFi, our mission is to create a borderless financial ecosystem that empowers individuals and communities worldwide. We believe that everyone deserves access to efficient, affordable, and secure financial services, regardless of their location or economic status.
              </p>
              <p className="text-lg text-gray-600">
                By leveraging the power of blockchain technology and the Stellar network, we're building a platform that eliminates the traditional barriers to cross-border payments, enabling instant, low-cost transfers that connect people across the globe.
              </p>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <div
                className="w-full h-64 rounded-lg shadow-xl bg-gradient-to-r from-blue-600 to-indigo-800 flex items-center justify-center p-6 text-white text-center"
              >
                <div>
                  <div className="text-5xl mb-4">🌍</div>
                  <div className="text-xl font-bold">Creating a borderless financial ecosystem</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pl-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Vision</h2>
              <p className="text-lg text-gray-600 mb-6">
                We envision a world where sending money across borders is as simple as sending a text message. A world where financial inclusion is the norm, not the exception, and where everyone has the tools they need to participate in the global economy.
              </p>
              <p className="text-lg text-gray-600">
                EazeFi is working to bridge the gap between traditional financial systems and blockchain technology, creating seamless experiences that make the benefits of decentralized finance accessible to all.
              </p>
            </div>
            <div className="md:w-1/2">
              <div
                className="w-full h-64 rounded-lg shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center p-6 text-white text-center"
              >
                <div>
                  <div className="text-5xl mb-4">🚀</div>
                  <div className="text-xl font-bold">Making global finance accessible to everyone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              EazeFi is built on cutting-edge blockchain technology to ensure security, speed, and scalability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-blue-600">Stellar Blockchain</h3>
              <p className="text-gray-600">
                We leverage the Stellar network for its fast transaction speeds, low fees, and built-in decentralized exchange capabilities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-blue-600">Soroban Smart Contracts</h3>
              <p className="text-gray-600">
                Our platform utilizes Soroban smart contracts to enable secure, programmable remittances and family pool functionality.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-blue-600">SDEX Integration</h3>
              <p className="text-gray-600">
                We've integrated the Stellar Decentralized Exchange to provide seamless token swapping and liquidity for cross-currency transfers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Meet the Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              EazeFi is built by a passionate team of blockchain developers, fintech experts, and global remittance specialists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <img
                src="/assets/images/team/david.jpg"
                alt="David Machuche"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-bold mb-1">David Machuche</h3>
              <p className="text-blue-600 mb-3">Founder & Lead Developer</p>
              <p className="text-gray-600 mb-4">
                Blockchain developer with expertise in Stellar and web development.
              </p>
              <div className="flex justify-center space-x-3">
                <a
                  href="https://github.com/0xMgwan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600"
                >
                  <FaGithub className="text-xl" />
                </a>
                <a
                  href="https://twitter.com/0xMgwan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600"
                >
                  <FaTwitter className="text-xl" />
                </a>
                <a
                  href="https://linkedin.com/in/davidmachuche"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600"
                >
                  <FaLinkedin className="text-xl" />
                </a>
              </div>
            </div>

            {/* Add more team members as needed */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the EazeFi Community</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Be part of the financial revolution and help us build a more inclusive global economy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300"
            >
              Create Account
            </Link>
            <a
              href="https://github.com/0xMgwan/EazeFi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
