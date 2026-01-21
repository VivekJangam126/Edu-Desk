require('dotenv').config({ path: './server/.env' });
const { uploadPDF, isR2Available } = require('./server/services/r2Storage');
const fs = require('fs');
const path = require('path');

async function testR2Storage() {
  try {
    console.log('🧪 Testing R2 Storage...\n');
    
    // Check if R2 is available
    console.log('1. Checking R2 availability...');
    const r2Available = isR2Available();
    console.log(`✅ R2 Available: ${r2Available}`);
    
    if (!r2Available) {
      console.log('❌ R2 not configured, skipping upload test');
      return;
    }
    
    // Test file upload
    console.log('\n2. Testing file upload...');
    
    // Create a simple test PDF buffer
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const testNoteId = 'test-note-' + Date.now();
    const testFileName = 'test-document.pdf';
    
    const fileUrl = await uploadPDF(testPdfContent, testNoteId, testFileName);
    console.log(`✅ File uploaded successfully: ${fileUrl}`);
    
    console.log('\n🎉 R2 storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ R2 storage test failed:', error.message);
  }
}

testR2Storage();