// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom Vercel build process...');

// Function to execute commands and log output
function runCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Ensure all required files exist
function ensureRequiredFiles() {
  const requiredComponents = [
    'src/components/wallet/FundTestnetWallet.js',
    'src/components/wallet/DebugBalanceChecker.js',
    'src/components/wallet/DirectBalanceDisplay.js',
    'src/components/wallet/TopBalanceDisplay.js',
    'src/components/wallet/DepositWithdraw.js',
    'src/components/remittance/CrossBorderPayment.js',
    'src/utils/sepUtils.js'
  ];

  let allFilesExist = true;
  
  requiredComponents.forEach(component => {
    const componentPath = path.join(__dirname, component);
    if (!fs.existsSync(componentPath)) {
      console.error(`Missing required component: ${component}`);
      allFilesExist = false;
    } else {
      console.log(`Found required component: ${component}`);
    }
  });
  
  return allFilesExist;
}

// Main build process
async function build() {
  console.log('Checking for required files...');
  const filesExist = ensureRequiredFiles();
  
  if (!filesExist) {
    console.warn('Some required files are missing, but continuing with build process.');
    // Don't exit, try to continue the build
  }
  
  console.log('Installing dependencies...');
  if (!runCommand('npm install --legacy-peer-deps')) {
    console.warn('Failed to install dependencies with --legacy-peer-deps, trying without...');
    if (!runCommand('npm install')) {
      console.error('Failed to install dependencies');
      process.exit(1);
    }
  }
  
  // Explicitly install the Stellar Wallets Kit package
  console.log('Explicitly installing Stellar Wallets Kit...');
  if (!runCommand('npm install @creit.tech/stellar-wallets-kit@1.7.3 --force')) {
    console.warn('Warning: Failed to explicitly install Stellar Wallets Kit, but continuing build');
    // Don't exit, try to continue the build
  }
  
  console.log('Building the application...');
  try {
    // Try using craco build directly
    if (!runCommand('npx craco build')) {
      console.warn('Failed to build with craco directly, trying npm run build...');
      if (!runCommand('npm run build')) {
        console.error('All build attempts failed');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
}

// Run the build process
build().catch(error => {
  console.error('Build process failed:', error);
  process.exit(1);
});
