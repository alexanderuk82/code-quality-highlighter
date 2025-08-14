const { exec } = require('child_process');

console.log('Testing compilation and linting...');

// Test TypeScript compilation
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  console.log('\n=== TypeScript Compilation ===');
  if (error) {
    console.log('FAILED:');
    console.log(stderr);
  } else {
    console.log('PASSED');
  }

  // Test ESLint
  exec('npx eslint src --ext ts', (error2, stdout2, stderr2) => {
    console.log('\n=== ESLint Check ===');
    if (error2) {
      console.log('FAILED:');
      console.log(stdout2);
      console.log(stderr2);
    } else {
      console.log('PASSED');
    }

    // Test Jest
    exec('npx jest --passWithNoTests', (error3, stdout3, stderr3) => {
      console.log('\n=== Jest Tests ===');
      if (error3) {
        console.log('FAILED:');
        console.log(stdout3);
        console.log(stderr3);
      } else {
        console.log('PASSED');
      }

      console.log('\n=== Summary ===');
      console.log('TypeScript:', error ? 'FAILED' : 'PASSED');
      console.log('ESLint:', error2 ? 'FAILED' : 'PASSED');
      console.log('Jest:', error3 ? 'FAILED' : 'PASSED');
    });
  });
});
