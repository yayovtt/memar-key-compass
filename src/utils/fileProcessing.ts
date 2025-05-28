
import { toast } from 'sonner';
import type { FileWithRelativeClientPath } from '@/types/bulkUpload';

export const processFiles = async (files: FileList): Promise<FileWithRelativeClientPath[]> => {
  const processedFiles: FileWithRelativeClientPath[] = [];
  for (const file of Array.from(files)) {
    if (file.webkitRelativePath) {
      const segments = file.webkitRelativePath.split('/');
      if (segments.length > 1) { // Needs at least ClientFolder/file.ext
        const clientName = segments[0];
        const pathWithinClientFolder = segments.slice(1).join('/');
        processedFiles.push({ file, clientName, pathWithinClientFolder });
      } else {
        toast.warning(`הקובץ "${file.name}" נמצא ישירות בתיקייה שנבחרה ולא בתוך תיקיית לקוח. המערכת תתעלם ממנו.`);
      }
    }
  }
  return processedFiles;
};
