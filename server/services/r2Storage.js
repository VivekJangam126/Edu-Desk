const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload PDF file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} noteId - Unique note identifier
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadPDF(fileBuffer, noteId, originalName) {
  try {
    // Validate inputs
    if (!fileBuffer || !noteId) {
      throw new Error('File buffer and noteId are required');
    }

    const key = `pdfs/${noteId}.pdf`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        originalName: originalName || 'document.pdf',
        uploadedAt: new Date().toISOString()
      }
    });
    
    await r2Client.send(command);
    
    // Return public URL using the R2 custom domain or public URL
    // For now, using the account-based URL format
    const publicUrl = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
    
    console.log(`PDF uploaded successfully: ${key}`);
    return publicUrl;
    
  } catch (error) {
    console.error('Error uploading PDF to R2:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}

/**
 * Delete PDF file from Cloudflare R2
 * @param {string} noteId - Unique note identifier
 * @returns {Promise<boolean>} - Success status
 */
async function deletePDF(noteId) {
  try {
    if (!noteId) {
      throw new Error('noteId is required');
    }

    const key = `pdfs/${noteId}.pdf`;
    
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    
    await r2Client.send(command);
    
    console.log(`PDF deleted successfully: ${key}`);
    return true;
    
  } catch (error) {
    console.error('Error deleting PDF from R2:', error);
    // Don't throw error for delete operations - log and continue
    return false;
  }
}

/**
 * Check if PDF exists in R2
 * @param {string} noteId - Unique note identifier
 * @returns {Promise<boolean>} - Existence status
 */
async function pdfExists(noteId) {
  try {
    const key = `pdfs/${noteId}.pdf`;
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });
    
    await r2Client.send(command);
    return true;
    
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Get public URL for a PDF
 * @param {string} noteId - Unique note identifier
 * @returns {string} - Public URL
 */
function getPDFUrl(noteId) {
  const key = `pdfs/${noteId}.pdf`;
  return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

// Validate R2 configuration on module load
function validateR2Config() {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing R2 environment variables: ${missing.join(', ')}`);
    console.warn('R2 storage will not be available');
    return false;
  }
  
  console.log('R2 storage service initialized successfully');
  return true;
}

// Check if R2 is available
function isR2Available() {
  return validateR2Config();
}

// Validate configuration on module load
const r2Available = validateR2Config();

module.exports = {
  uploadPDF,
  deletePDF,
  pdfExists,
  getPDFUrl,
  isR2Available: () => r2Available,
  r2Client
};