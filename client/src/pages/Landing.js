import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaGlobeAfrica, FaBolt, FaShieldAlt, FaExchangeAlt, FaUsers, FaMobileAlt, FaArrowRight, FaPaperPlane, FaWallet, FaUser, FaChevronRight } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="bg-black text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="text-white">SEND MONEY</span><br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">ANYWHERE</span>
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-gray-300">
                Send money anywhere, travel back home with Eaze.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-8 rounded-md transition duration-300 text-center flex items-center justify-center"
                >
                  Get Started <FaArrowRight className="ml-2" />
                </Link>
                <Link
                  to="/about"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-bold py-4 px-8 rounded-md transition duration-300 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full opacity-50 blur-xl"></div>
              <div
                className="w-full h-auto rounded-xl shadow-2xl relative z-10 flex items-center justify-center"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)',
                  minHeight: '300px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '24px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden'
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-5xl mb-4">🌍</span>
                  <span>Global Money Transfer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-black">Why Choose EazeFi?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform leverages blockchain technology to provide secure, fast, and affordable cross-border payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaGlobeAfrica className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Global Reach</h3>
              <p className="text-gray-600">
                Send money to anyone, anywhere in the world, regardless of their banking status.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaBolt className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Transfers</h3>
              <p className="text-gray-600">
                Experience near-instant settlement times, eliminating the usual delays of traditional banking.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaShieldAlt className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Transparent</h3>
              <p className="text-gray-600">
                Built on Stellar blockchain, ensuring security, transparency, and immutability of all transactions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaExchangeAlt className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Token Swapping</h3>
              <p className="text-gray-600">
                Easily swap between different currencies and tokens using our integrated SDEX functionality.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaUsers className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Family Pools</h3>
              <p className="text-gray-600">
                Create shared pools for family members to contribute to remittances collectively.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:border-black transition duration-300">
              <div className="text-black mb-4">
                <FaMobileAlt className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mobile Money Integration</h3>
              <p className="text-gray-600">
                Seamlessly connect with local mobile money providers for easy cash-in and cash-out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Send money around the world in 3 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-white transition duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                  1
                </div>
                <h3 className="text-xl font-bold">Create an Account</h3>
              </div>
              <div className="mb-6 text-5xl text-white">
                <FaUser />
              </div>
              <p className="text-gray-400">
                Sign up for an EazeFi account and complete the simple verification process.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-white transition duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                  2
                </div>
                <h3 className="text-xl font-bold">Fund Your Wallet</h3>
              </div>
              <div className="mb-6 text-5xl text-white">
                <FaWallet />
              </div>
              <p className="text-gray-400">
                Add funds to your wallet using bank transfer, mobile money, or cryptocurrency.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-white transition duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4">
                  3
                </div>
                <h3 className="text-xl font-bold">Send Money</h3>
              </div>
              <div className="mb-6 text-5xl text-white">
                <FaPaperPlane />
              </div>
              <p className="text-gray-400">
                Enter recipient details, select the amount, and send money instantly across borders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-black rounded-2xl p-12 text-white text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">{isAuthenticated ? 'Ready to Explore More?' : 'Ready to Get Started?'}</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-300">
              {isAuthenticated 
                ? 'Discover all the features and benefits of EazeFi to make your financial transactions easier and more secure.'
                : 'Join thousands of users who are already enjoying fast, secure, and affordable cross-border payments with EazeFi.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/wallet"
                    className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-8 rounded-md transition duration-300 inline-block"
                  >
                    Go to Wallet
                  </Link>
                  <Link
                    to="/send-money"
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-bold py-4 px-8 rounded-md transition duration-300 inline-block"
                  >
                    Send Money
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-8 rounded-md transition duration-300 inline-block"
                  >
                    Create Your Account
                  </Link>
                  <Link
                    to="/login"
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-bold py-4 px-8 rounded-md transition duration-300 inline-block"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
