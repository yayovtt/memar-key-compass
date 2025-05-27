
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UploadCloud, Loader2, FileUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ClientFileUploaderProps {
  clientId: string;
  onUploadSuccess: () => void;
}

const ClientFileUploader: React.FC<ClientFileUploaderProps> = ({ clientId, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('אנא בחר קובץ אחד או יותר, או תיקייה להעלאה.');
      return;
    }
    console.log('[ClientUploader] handleUpload: Starting upload. Provided clientId prop:', clientId);

    setUploading(true);
    const isFolderUpload = selectedFiles.length > 0 && selectedFiles[0]?.webkitRelativePath && selectedFiles[0].webkitRelativePath.trim() !== "";
    const uploadTypeMessage = isFolderUpload ? 
      `תיקיית "${selectedFiles[0].webkitRelativePath.split('/')[0]}" (${selectedFiles.length} קבצים)` : 
      `${selectedFiles.length} קבצים`;
      
    toast.info(`מתחיל העלאה של ${uploadTypeMessage}...`);

    let filesUploadedSuccessfully = 0;

    const { data: userSession, error: userError } = await supabase.auth.getUser();
    if (userError || !userSession?.user) {
      toast.error('שגיאת אימות. נסה להתחבר מחדש.');
      console.error('[ClientUploader] handleUpload: User session error.', userError);
      setUploading(false);
      return;
    }
    const userId = userSession.user.id;
    console.log('[ClientUploader] handleUpload: userId:', userId, 'using prop clientId:', clientId);

    for (const file of selectedFiles) {
      console.log('[ClientUploader] handleUpload: Processing file:', file.name, 'webkitRelativePath:', file.webkitRelativePath);
      try {
        let storagePathForSupabase: string;
        
        if (file.webkitRelativePath && file.webkitRelativePath.trim() !== "") {
          storagePathForSupabase = `${userId}/${clientId}/${file.webkitRelativePath}`;
        } else {
          const fileExtension = file.name.split('.').pop() || '';
          const uniqueFileName = `${uuidv4()}.${fileExtension}`;
          storagePathForSupabase = `${userId}/${clientId}/${uniqueFileName}`;
        }
        console.log('[ClientUploader] handleUpload: Calculated storagePathForSupabase:', storagePathForSupabase);
        
        const { error: uploadError } = await supabase.storage
          .from('client_files_bucket')
          .upload(storagePathForSupabase, file, { upsert: true });

        if (uploadError) {
          console.error(`[ClientUploader] Error uploading ${file.webkitRelativePath || file.name} to storage:`, uploadError);
          throw new Error(`שגיאה בהעלאת הקובץ "${file.webkitRelativePath || file.name}" לאחסון: ${uploadError.message}`);
        }

        const fileMetadata = {
          client_id: clientId, // From prop
          user_id: userId,
          file_name: file.name,
          storage_path: storagePathForSupabase,
          file_type: file.type,
          file_size: file.size,
        };
        console.log('[ClientUploader] handleUpload: Attempting to insert file metadata to DB:', fileMetadata);
        const { error: dbError } = await supabase.from('client_files').insert(fileMetadata);

        if (dbError) {
          console.error(`[ClientUploader] Error inserting metadata for ${file.webkitRelativePath || file.name} to DB:`, dbError);
          await supabase.storage.from('client_files_bucket').remove([storagePathForSupabase]);
          throw new Error(`שגיאה בשמירת מידע על הקובץ "${file.webkitRelativePath || file.name}": ${dbError.message}`);
        }

        toast.success(`הקובץ "${file.webkitRelativePath || file.name}" הועלה בהצלחה!`);
        filesUploadedSuccessfully++;
        onUploadSuccess(); 
      } catch (error: any) {
        console.error(`[ClientUploader] Upload process error for ${file.webkitRelativePath || file.name}:`, error);
        toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.webkitRelativePath || file.name}".`);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    
    if (filesUploadedSuccessfully > 0 && filesUploadedSuccessfully < selectedFiles.length) {
        toast.info(`${filesUploadedSuccessfully} מתוך ${selectedFiles.length} קבצים הועלו בהצלחה.`);
    }
        
    setSelectedFiles([]);
    setUploading(false);
  };
  
  // Check webkitRelativePath: it's non-empty for folder contents
  const isCurrentlyUploadingFolder = selectedFiles.length > 0 && selectedFiles[0]?.webkitRelativePath && selectedFiles[0].webkitRelativePath.trim() !== "";

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <Label htmlFor="file-upload-input" className="text-lg font-medium">העלאת קבצים או תיקיות</Label>
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <Input 
          id="file-upload-input" 
          type="file" 
          multiple 
          // @ts-expect-error webkitdirectory is a non-standard attribute but widely supported
          webkitdirectory="" 
          directory="" // Standard attribute for folder selection
          onChange={handleFileChange} 
          disabled={uploading} 
          className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 flex-grow"
          ref={fileInputRef}
        />
        <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading} className="w-full sm:w-auto shrink-0">
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
      {selectedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1 mt-2">
          {isCurrentlyUploadingFolder ? (
            <p className="font-medium">
              תיקייה נבחרה: {selectedFiles[0].webkitRelativePath.split('/')[0]} ({selectedFiles.length} קבצים)
            </p>
          ) : (
            <p className="font-medium">קבצים שנבחרו ({selectedFiles.length}):</p>
          )}
          <ul className="list-disc pl-5 max-h-32 overflow-y-auto bg-muted/30 p-2 rounded">
            {selectedFiles.map((file, index) => (
              <li key={index} className="truncate" title={file.webkitRelativePath || file.name}>
                {file.webkitRelativePath || file.name} ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientFileUploader;
