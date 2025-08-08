// Simple file upload utility
// In production, you would integrate with services like AWS S3, Cloudinary, etc.

export const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    // For demo purposes, we'll simulate an upload and return a URL
    // In production, you would upload to a real file storage service
    
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Simulate upload delay
    setTimeout(() => {
      // Create a blob URL for demo purposes
      const url = URL.createObjectURL(file);
      resolve({
        url: url,
        filename: file.name,
        size: file.size,
        type: file.type
      });
    }, 1000);
  });
};

export const validateFile = (file) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF or Word document');
  }

  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  return true;
};