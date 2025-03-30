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
  
  // Create a fix for the process/browser issue
  console.log('Creating process/browser fix...');
  const processFix = `
  // Fix for process/browser polyfill
  if (typeof process === 'undefined') {
    window.process = { browser: true, env: { NODE_ENV: 'production' } };
  }
  `;
  
  // Create a file with the process fix
  fs.writeFileSync(path.join(__dirname, 'src', 'processFix.js'), processFix);
  
  // Add import to index.js
  const indexPath = path.join(__dirname, 'src', 'index.js');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('processFix')) {
    indexContent = `import './processFix';
${indexContent}`;
    fs.writeFileSync(indexPath, indexContent);
    console.log('Added process fix to index.js');
  }
  
  console.log('Installing dependencies with --force to resolve conflicts...');
  if (!runCommand('npm install --force')) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
  
  // Explicitly install key packages
  console.log('Installing critical dependencies...');
  if (!runCommand('npm install process path-browserify os-browserify stream-browserify buffer crypto-browserify --force')) {
    console.warn('Warning: Failed to install some polyfills, but continuing build');
  }
  
  console.log('Building the application with CI=false to ignore warnings...');
  try {
    // Set environment variables for the build
    process.env.CI = 'false';
    process.env.GENERATE_SOURCEMAP = 'false';
    
    if (!runCommand('CI=false GENERATE_SOURCEMAP=false npm run build')) {
      console.warn('Standard build failed, trying with craco directly...');
      if (!runCommand('CI=false GENERATE_SOURCEMAP=false npx craco build')) {
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
