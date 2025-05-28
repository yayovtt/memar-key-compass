
// File validation utilities
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `הקובץ גדול מדי. גודל מקסימלי: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  // Check if it's an allowed file type
  const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allAllowedTypes.includes(file.type) && file.type !== '') {
    console.log(`File type not in allowed list: ${file.type}`);
    // Don't block files with empty type - let Supabase handle them
  }

  return { isValid: true };
};

export const getFileTypeCategory = (file: File): 'image' | 'video' | 'document' | 'other' => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return 'document';
  return 'other';
};
