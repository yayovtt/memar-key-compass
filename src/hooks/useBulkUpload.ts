
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { processFiles } from '@/utils/fileProcessing';
import { getOrCreateClient } from '@/utils/clientManagement';
import type { FileWithRelativeClientPath } from '@/types/bulkUpload';

export const useBulkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadFiles = async (
    selectedRootFolder: FileList,
    onUploadComplete: () => void
  ) => {
    if (!selectedRootFolder || selectedRootFolder.length === 0) {
      toast.error('אנא בחר תיקייה ראשית המכילה תיקיות לקוחות.');
      return;
    }

    setUploading(true);
    const rootFolderName = selectedRootFolder[0].webkitRelativePath.split('/')[0] || "תיקייה ראשית";
    toast.info(`מתחיל עיבוד והעלאה עבור "${rootFolderName}"...`);
    console.log('[BulkUploader] handleUpload: Starting upload process.');

    const { data: userSession, error: userError } = await supabase.auth.getUser();
    if (userError || !userSession?.user) {
      toast.error('שגיאת אימות. נסה להתחבר מחדש.');
      console.error('[BulkUploader] handleUpload: User session error.', userError);
      setUploading(false);
      return;
    }
    const userId = userSession.user.id;
    console.log('[BulkUploader] handleUpload: userId:', userId);

    const filesToUpload = await processFiles(selectedRootFolder);
    if (filesToUpload.length === 0 && selectedRootFolder.length > 0) {
        toast.info("לא נמצאו קבצים בתוך תתי-תיקיות של לקוחות בתיקייה שנבחרה.");
        setUploading(false);
        return;
    }

    const filesByClientName: Record<string, { file: File, pathWithinClientFolder: string }[]> = {};
    filesToUpload.forEach(item => {
      if (!filesByClientName[item.clientName]) {
        filesByClientName[item.clientName] = [];
      }
      filesByClientName[item.clientName].push({ file: item.file, pathWithinClientFolder: item.pathWithinClientFolder });
    });
    
    let overallSuccess = true;

    for (const clientName in filesByClientName) {
      console.log('[BulkUploader] handleUpload: Processing clientName:', clientName);
      const clientId = await getOrCreateClient(clientName, userId);
      console.log('[BulkUploader] handleUpload: For clientName:', clientName, 'obtained clientId:', clientId);

      if (!clientId) {
        overallSuccess = false;
        toast.error(`לא ניתן היה לקבל או ליצור ID עבור הלקוח "${clientName}". מדלג על קבצים אלו.`);
        continue;
      }

      const clientFiles = filesByClientName[clientName];
      for (const { file, pathWithinClientFolder } of clientFiles) {
        const storagePathForSupabase = `${userId}/${clientId}/${pathWithinClientFolder}`;
        console.log('[BulkUploader] handleUpload: Attempting to upload file:', file.name, 'to storagePath:', storagePathForSupabase, 'for clientId:', clientId, 'userId:', userId);
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('client_files_bucket')
            .upload(storagePathForSupabase, file, { upsert: true });

          if (uploadError) {
            console.error(`[BulkUploader] Error uploading ${file.name} to storage:`, uploadError);
            throw new Error(`שגיאה בהעלאת הקובץ "${file.name}" לאחסון: ${uploadError.message}`);
          }

          const fileMetadata = {
            client_id: clientId,
            user_id: userId,
            file_name: file.name,
            storage_path: storagePathForSupabase,
            file_type: file.type,
            file_size: file.size,
          };
          console.log('[BulkUploader] handleUpload: Attempting to insert file metadata to DB:', fileMetadata);
          const { error: dbError } = await supabase.from('client_files').insert(fileMetadata);

          if (dbError) {
            await supabase.storage.from('client_files_bucket').remove([storagePathForSupabase]); 
            console.error('[BulkUploader] handleUpload: DB insert error for file:', file.name, dbError);
            throw new Error(`שגיאה בשמירת מידע על הקובץ "${file.name}": ${dbError.message}`);
          }
        } catch (error: any) {
          overallSuccess = false;
          toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.name}" עבור הלקוח "${clientName}".`);
          console.error('[BulkUploader] handleUpload: Catch block error for file:', file.name, error);
        }
      }
      toast.success(`הסתיימה העלאת הקבצים עבור הלקוח "${clientName}".`);
    }

    setUploading(false);

    if (overallSuccess && filesToUpload.length > 0) {
      toast.success('כל הקבצים מתיקיות הלקוחות הועלו בהצלחה!');
    } else if (filesToUpload.length > 0) {
      toast.warning('חלק מהקבצים לא הועלו. בדוק את ההודעות לפרטים.');
    }
    
    queryClient.invalidateQueries({ queryKey: ['allClientsForFolders'] });
    queryClient.invalidateQueries({ queryKey: ['allClientFilesForFolderPage'] });
    onUploadComplete();
  };

  return {
    uploading,
    uploadFiles
  };
};
