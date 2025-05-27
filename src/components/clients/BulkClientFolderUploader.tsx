
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
          // This case (file directly in selected root, not in a client subfolder) might be ignored or handled differently.
          // For now, we assume client folders are direct children of the selected root.
          toast.warning(`הקובץ "${file.name}" נמצא ישירות בתיקייה שנבחרה ולא בתוך תיקיית לקוח. המערכת תתעלם ממנו.`);
        }
      }
    }
    return processedFiles;
  };
  
  const getOrCreateClient = async (clientName: string, userId: string): Promise<string | null> => {
    // Check if client exists
    let { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('name', clientName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 0 rows
      toast.error(`שגיאה בבדיקת לקוח קיים "${clientName}": ${fetchError.message}`);
      return null;
    }

    if (existingClient) {
      return existingClient.id;
    }

    // Create new client
    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({ name: clientName, created_by_user_id: userId }) // created_by_user_id might be auto by default policy
      .select('id')
      .single();

    if (insertError) {
      toast.error(`שגיאה ביצירת לקוח חדש "${clientName}": ${insertError.message}`);
      return null;
    }
    if (!newClient) {
        toast.error(`לא הצלחנו ליצור לקוח חדש "${clientName}".`);
        return null;
    }
    toast.success(`לקוח חדש "${clientName}" נוצר בהצלחה.`);
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

    const { data: userSession, error: userError } = await supabase.auth.getUser();
    if (userError || !userSession?.user) {
      toast.error('שגיאת אימות. נסה להתחבר מחדש.');
      setUploading(false);
      return;
    }
    const userId = userSession.user.id;

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
      toast.info(`מעבד את הלקוח: ${clientName}...`);
      const clientId = await getOrCreateClient(clientName, userId);
      if (!clientId) {
        overallSuccess = false;
        toast.error(`לא ניתן היה לקבל או ליצור ID עבור הלקוח "${clientName}". מדלג על קבצים אלו.`);
        continue;
      }

      const clientFiles = filesByClientName[clientName];
      for (const { file, pathWithinClientFolder } of clientFiles) {
        const storagePathForSupabase = `${clientId}/${pathWithinClientFolder}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('client_files_bucket')
            .upload(storagePathForSupabase, file, { upsert: true });

          if (uploadError) {
            throw new Error(`שגיאה בהעלאת הקובץ "${file.name}" לאחסון: ${uploadError.message}`);
          }

          const { error: dbError } = await supabase.from('client_files').insert({
            client_id: clientId,
            user_id: userId,
            file_name: file.name,
            storage_path: storagePathForSupabase,
            file_type: file.type,
            file_size: file.size,
          });

          if (dbError) {
            await supabase.storage.from('client_files_bucket').remove([storagePathForSupabase]); // Rollback storage
            throw new Error(`שגיאה בשמירת מידע על הקובץ "${file.name}": ${dbError.message}`);
          }
          // Individual success toast can be too noisy for bulk uploads. Consider a summary.
          // toast.success(`הקובץ "${pathWithinClientFolder}" (לקוח: ${clientName}) הועלה בהצלחה!`);
        } catch (error: any) {
          overallSuccess = false;
          toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.name}" עבור הלקוח "${clientName}".`);
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

