// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom Vercel build process...');

// Function to execute commands and log output
function runCommand(command, cwd = process.cwd()) {
  console.log(`Executing: ${command} in ${cwd}`);
  try {
    const output = execSync(command, { encoding: 'utf8', cwd });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main build process
async function build() {
  // Create client build
  console.log('Building client application...');
  
  // Install client dependencies
  console.log('Installing client dependencies...');
  if (!runCommand('npm install --no-optional', path.join(process.cwd(), 'client'))) {
    console.error('Failed to install client dependencies');
    process.exit(1);
  }
  
  // Create process fix
  console.log('Creating process fix...');
  const processFix = `
// Fix for process/browser polyfill - must be first
if (typeof process === 'undefined') {
  window.process = { 
    browser: true, 
    env: { 
      NODE_ENV: 'production' 
    } 
  };
}

// Add global Buffer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Ensure global is defined
window.global = window;
`;
  
  // Write process fix to a file
  fs.writeFileSync(path.join(process.cwd(), 'client', 'src', 'processFix.js'), processFix);
  
  // Add import to index.js
  const indexPath = path.join(process.cwd(), 'client', 'src', 'index.js');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('processFix')) {
    indexContent = `import './processFix';\n${indexContent}`;
    fs.writeFileSync(indexPath, indexContent);
    console.log('Added process fix to index.js');
  }
  
  // Build client
  console.log('Building client application...');
  if (!runCommand('CI=false GENERATE_SOURCEMAP=false npm run build', path.join(process.cwd(), 'client'))) {
    console.error('Failed to build client application');
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
}

// Run the build process
build().catch(error => {
  console.error('Build process failed:', error);
  process.exit(1);
});
