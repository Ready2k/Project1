#!/usr/bin/env node

// Corporate-friendly installation script
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Installing dependencies for corporate environment...');

try {
  // Try standard npm install first
  execSync('npm install --no-optional --legacy-peer-deps', { stdio: 'inherit' });
  console.log('✅ Installation successful!');
} catch (error) {
  console.log('❌ Standard install failed, trying alternative approach...');
  
  // Alternative: install core dependencies only
  const corePackages = [
    'react@^18.2.0',
    'react-dom@^18.2.0',
    'reactflow@^11.10.1'
  ];
  
  const devPackages = [
    '@types/react@^19.1.8',
    '@types/react-dom@^19.1.6'
  ];
  
  try {
    execSync(`npm install ${corePackages.join(' ')} --legacy-peer-deps`, { stdio: 'inherit' });
    execSync(`npm install ${devPackages.join(' ')} --save-dev --legacy-peer-deps`, { stdio: 'inherit' });
    
    // Install react-scripts separately with specific flags
    execSync('npm install react-scripts@5.0.1 --legacy-peer-deps --no-optional', { stdio: 'inherit' });
    
    console.log('✅ Alternative installation successful!');
  } catch (altError) {
    console.error('❌ All installation methods failed.');
    console.error('Please contact your IT department about npm registry access.');
    process.exit(1);
  }
}