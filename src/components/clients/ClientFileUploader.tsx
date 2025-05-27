
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UploadCloud, Loader2, FileUp } from 'lucide-react'; // FileUp is used, UploadCloud is not directly but fine to keep
import { v4 as uuidv4 } from 'uuid';

interface ClientFileUploaderProps {
  clientId: string;
  onUploadSuccess: () => void;
}

// Extend File interface to include webkitRelativePath
interface FileWithRelativePath extends File {
  webkitRelativePath?: string;
}

const ClientFileUploader: React.FC<ClientFileUploaderProps> = ({ clientId, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithRelativePath[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files) as FileWithRelativePath[]);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('אנא בחר קובץ אחד או יותר, או תיקייה להעלאה.');
      return;
    }

    setUploading(true);
    const isFolderUpload = selectedFiles.length > 0 && selectedFiles[0]?.webkitRelativePath && selectedFiles[0].webkitRelativePath.trim() !== "";
    const uploadTypeMessage = isFolderUpload ? 
      `תיקיית "${selectedFiles[0].webkitRelativePath.split('/')[0]}" (${selectedFiles.length} קבצים)` : 
      `${selectedFiles.length} קבצים`;
      
    toast.info(`מתחיל העלאה של ${uploadTypeMessage}...`);

    let filesUploadedSuccessfully = 0;

    for (const file of selectedFiles) {
      try {
        const { data: userSession, error: userError } = await supabase.auth.getUser();
        if (userError || !userSession?.user) {
          toast.error('שגיאת אימות. נסה להתחבר מחדש.');
          throw new Error('שגיאת אימות');
        }
        const userId = userSession.user.id;

        let storagePathForSupabase: string;
        // file.name is the actual name of the file, e.g., "document.pdf"
        // file.webkitRelativePath is e.g., "FolderName/SubFolderName/document.pdf" or "" if not a folder upload

        if (file.webkitRelativePath && file.webkitRelativePath.trim() !== "") {
          // File came from a directory selection, use its relative path.
          storagePathForSupabase = `${clientId}/${file.webkitRelativePath}`;
        } else {
          // Not part of a directory selection (e.g., individually selected file)
          // or webkitRelativePath is empty/not present.
          const fileExtension = file.name.split('.').pop() || '';
          const uniqueFileName = `${uuidv4()}.${fileExtension}`;
          storagePathForSupabase = `${clientId}/${uniqueFileName}`;
        }
        
        const { error: uploadError } = await supabase.storage
          .from('client_files_bucket')
          .upload(storagePathForSupabase, file, { upsert: true }); // upsert:true will overwrite if file exists

        if (uploadError) {
          console.error(`Error uploading ${file.webkitRelativePath || file.name} to storage:`, uploadError);
          throw new Error(`שגיאה בהעלאת הקובץ "${file.webkitRelativePath || file.name}" לאחסון: ${uploadError.message}`);
        }

        const { error: dbError } = await supabase.from('client_files').insert({
          client_id: clientId,
          user_id: userId,
          file_name: file.name, // Always the base name of the file
          storage_path: storagePathForSupabase, // Full path in Supabase storage
          file_type: file.type,
          file_size: file.size,
        });

        if (dbError) {
          console.error(`Error inserting metadata for ${file.webkitRelativePath || file.name} to DB:`, dbError);
          // Attempt to clean up orphaned file - this might be complex if part of a batch failed
          // For now, log and notify. Full rollback is more involved.
          await supabase.storage.from('client_files_bucket').remove([storagePathForSupabase]);
          throw new Error(`שגיאה בשמירת מידע על הקובץ "${file.webkitRelativePath || file.name}": ${dbError.message}`);
        }

        toast.success(`הקובץ "${file.webkitRelativePath || file.name}" הועלה בהצלחה!`);
        filesUploadedSuccessfully++;
        onUploadSuccess(); // Refresh list after each successful upload
      } catch (error: any) {
        console.error(`Upload process error for ${file.webkitRelativePath || file.name}:`, error);
        toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.webkitRelativePath || file.name}".`);
      }
    }

    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
    
    if (filesUploadedSuccessfully > 0 && filesUploadedSuccessfully < selectedFiles.length) {
        toast.info(`${filesUploadedSuccessfully} מתוך ${selectedFiles.length} קבצים הועלו בהצלחה.`);
    } else if (filesUploadedSuccessfully === selectedFiles.length && selectedFiles.length > 0) {
        // Individual success toasts are already shown.
        // Optional summary: toast.success(`כל ${selectedFiles.length} הקבצים מתוך ${uploadTypeMessage} הועלו בהצלחה!`);
    }
    
    // Reset selectedFiles only after all operations are done,
    // because the UI for selected files might depend on it until the very end.
    setSelectedFiles([]);
    setUploading(false);
  };

  const isCurrentlyUploadingFolder = selectedFiles.length > 0 && selectedFiles[0]?.webkitRelativePath && selectedFiles[0].webkitRelativePath.trim() !== "";

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <Label htmlFor="file-upload-input" className="text-lg font-medium">העלאת קבצים או תיקיות</Label>
      <Input 
        id="file-upload-input" 
        type="file" 
        multiple // Allow multiple file selection OR folder selection
        // @ts-expect-error TS doesn't know webkitdirectory by default
        webkitdirectory="" 
        directory="" // For Firefox and other browsers supporting the standard attribute
        onChange={handleFileChange} 
        disabled={uploading} 
        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        ref={fileInputRef}
      />
      {selectedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          {isCurrentlyUploadingFolder ? (
            <p className="font-medium">
              תיקייה נבחרה: {selectedFiles[0].webkitRelativePath.split('/')[0]} ({selectedFiles.length} קבצים)
            </p>
          ) : (
            <p className="font-medium">קבצים שנבחרו ({selectedFiles.length}):</p>
          )}
          <ul className="list-disc pl-5 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <li key={index} className="truncate" title={file.webkitRelativePath || file.name}>
                {file.webkitRelativePath || file.name} ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading} className="w-full sm:w-auto">
        {uploading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מעלה...
          </>
        ) : (
          <>
            <FileUp className="ml-2 h-4 w-4" /> 
            {isCurrentlyUploadingFolder ? `העלה תיקייה` : (selectedFiles.length > 1 ? `העלה ${selectedFiles.length} קבצים` : 'העלה קובץ')}
          </>
        )}
      </Button>
    </div>
  );
};

export default ClientFileUploader;

