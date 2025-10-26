import 'tsconfig-paths/register';
import { RealMCPSandbox } from './src/modules/core/services/sandbox/RealMCPSandbox';

async function testAPIDirect() {
  console.log('========================================');
  console.log('Testing MCP as if called from API');
  console.log('========================================');
  console.log('');

  const sandbox = new RealMCPSandbox();
  
  try {
    console.log('1. Initializing sandbox...');
    await sandbox.initialize();
    console.log('   ✅ Sandbox initialized');
    console.log('');

    console.log('2. Loading @pollinations/model-context-protocol...');
    console.log('   (This is where it fails in the API)');
    console.log('');
    
    await sandbox.loadMCP('@pollinations/model-context-protocol');
    console.log('   ✅ MCP loaded successfully!');
    console.log('');

    console.log('3. Extracting tools...');
    const tools = await sandbox.extractTools();
    console.log(`   ✅ Found ${tools.length} tools`);
    tools.forEach((tool, i) => {
      console.log(`      ${i+1}. ${tool.getName()}`);
    });
    console.log('');

    console.log('4. Cleaning up...');
    await sandbox.destroy();
    console.log('   ✅ Cleaned up');
    console.log('');

    console.log('========================================');
    console.log('✅ TEST PASSED!');
    console.log('========================================');
    
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED!');
    console.error('========================================');
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPIDirect();
