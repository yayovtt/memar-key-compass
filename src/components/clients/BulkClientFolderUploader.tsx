
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UploadCloud, Loader2, FolderUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client } from '@/hooks/useClientFoldersData'; // Assuming Client type is exported

interface BulkClientFolderUploaderProps {
  onUploadComplete: () => void;
}

interface FileWithRelativeClientPath {
  file: File;
  clientName: string;
  pathWithinClientFolder: string;
}

const BulkClientFolderUploader: React.FC<BulkClientFolderUploaderProps> = ({ onUploadComplete }) => {
  const [selectedRootFolder, setSelectedRootFolder] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRootFolder(event.target.files);
  };

  const processFiles = async (files: FileList): Promise<FileWithRelativeClientPath[]> => {
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
  
  const getOrCreateClient = async (clientName: string, userId: string): Promise<string | null> => {
    console.log('[BulkUploader] getOrCreateClient: Attempting for clientName:', clientName, 'userId:', userId);
    let { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('name', clientName)
      .eq('created_by_user_id', userId) 
      .single();
    console.log('[BulkUploader] getOrCreateClient: existingClient query result:', { existingClient, fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') { 
      toast.error(`שגיאה בבדיקת לקוח קיים "${clientName}": ${fetchError.message}`);
      return null;
    }

    if (existingClient) {
      console.log('[BulkUploader] getOrCreateClient: Found existing client ID:', existingClient.id);
      return existingClient.id;
    }

    console.log('[BulkUploader] getOrCreateClient: No existing client found, creating new one.');
    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({ name: clientName, created_by_user_id: userId })
      .select('id')
      .single();
    console.log('[BulkUploader] getOrCreateClient: newClient query result:', { newClient, insertError });

    if (insertError) {
      toast.error(`שגיאה ביצירת לקוח חדש "${clientName}": ${insertError.message}`);
      return null;
    }
    if (!newClient) {
        toast.error(`לא הצלחנו ליצור לקוח חדש "${clientName}".`);
        return null;
    }
    toast.success(`לקוח חדש "${clientName}" נוצר בהצלחה.`);
    console.log('[BulkUploader] getOrCreateClient: Created new client ID:', newClient.id);
    return newClient.id;
  };

  const handleUpload = async () => {
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
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSelectedRootFolder(null);
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
          // toast.success(`הקובץ "${pathWithinClientFolder}" (לקוח: ${clientName}) הועלה בהצלחה!`);
        } catch (error: any) {
          overallSuccess = false;
          toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.name}" עבור הלקוח "${clientName}".`);
          console.error('[BulkUploader] handleUpload: Catch block error for file:', file.name, error);
        }
      }
      toast.success(`הסתיימה העלאת הקבצים עבור הלקוח "${clientName}".`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedRootFolder(null);
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

  const selectedDirName = selectedRootFolder && selectedRootFolder.length > 0 ? selectedRootFolder[0].webkitRelativePath.split('/')[0] : null;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card mb-6">
      <Label htmlFor="bulk-folder-upload-input" className="text-lg font-medium">העלאת תיקיית לקוחות ראשית</Label>
      <p className="text-sm text-muted-foreground">
        בחר תיקייה ראשית. כל תת-תיקייה ישירה בתוכה תטופל כתיקיית לקוח (שם תת-התיקייה יהיה שם הלקוח).
      </p>
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <Input
          id="bulk-folder-upload-input"
          type="file"
          // @ts-expect-error webkitdirectory is a non-standard attribute but widely supported
          webkitdirectory=""
          directory="" // Standard attribute for folder selection
          onChange={handleFileChange}
          disabled={uploading}
          className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 flex-grow"
          ref={fileInputRef}
          title="בחר תיקייה ראשית המכילה את כל תיקיות הלקוחות"
        />
        <Button onClick={handleUpload} disabled={!selectedRootFolder || selectedRootFolder.length === 0 || uploading} className="w-full sm:w-auto shrink-0">
          {uploading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              מעלה ומעבד...
            </>
          ) : (
            <>
              <FolderUp className="ml-2 h-4 w-4" />
              העלה תיקיית לקוחות
            </>
          )}
        </Button>
      </div>
      {selectedDirName && !uploading && (
        <div className="text-sm text-muted-foreground mt-2">
            <p className="font-medium">
              תיקייה ראשית נבחרה: {selectedDirName} ({selectedRootFolder?.length} קבצים ותתי-תיקיות בפנים)
            </p>
             <p className="text-xs">המערכת תחפש תתי-תיקיות ישירות בתוך "{selectedDirName}" ותתייחס אליהן כתיקיות לקוח.</p>
        </div>
      )}
    </div>
  );
};

export default BulkClientFolderUploader;
