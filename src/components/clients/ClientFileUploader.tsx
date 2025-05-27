
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
      toast.error('אנא בחר קובץ אחד או יותר להעלאה.');
      return;
    }

    setUploading(true);
    toast.info(`מתחיל העלאה של ${selectedFiles.length} קבצים...`);

    let filesUploadedSuccessfully = 0;

    for (const file of selectedFiles) {
      try {
        const { data: userSession, error: userError } = await supabase.auth.getUser();
        if (userError || !userSession?.user) {
          toast.error('שגיאת אימות. נסה להתחבר מחדש.');
          // Optionally stop further uploads if auth fails critically
          // setUploading(false); 
          // return;
          throw new Error('שגיאת אימות');
        }
        const userId = userSession.user.id;

        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${clientId}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('client_files_bucket')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error uploading ${file.name} to storage:`, uploadError);
          throw new Error(`שגיאה בהעלאת הקובץ "${file.name}" לאחסון: ${uploadError.message}`);
        }

        const { error: dbError } = await supabase.from('client_files').insert({
          client_id: clientId,
          user_id: userId,
          file_name: file.name,
          storage_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

        if (dbError) {
          console.error(`Error inserting metadata for ${file.name} to DB:`, dbError);
          await supabase.storage.from('client_files_bucket').remove([filePath]); // Attempt to clean up orphaned file
          throw new Error(`שגיאה בשמירת מידע על הקובץ "${file.name}": ${dbError.message}`);
        }

        toast.success(`הקובץ "${file.name}" הועלה בהצלחה!`);
        filesUploadedSuccessfully++;
        onUploadSuccess(); // Refresh list after each successful upload
      } catch (error: any) {
        console.error(`Upload process error for ${file.name}:`, error);
        toast.error(error.message || `אירעה שגיאה במהלך העלאת הקובץ "${file.name}".`);
      }
    }

    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
    
    if (filesUploadedSuccessfully > 0 && filesUploadedSuccessfully < selectedFiles.length) {
        toast.info(`${filesUploadedSuccessfully} מתוך ${selectedFiles.length} קבצים הועלו בהצלחה.`);
    } else if (filesUploadedSuccessfully === selectedFiles.length && selectedFiles.length > 0) {
        // Individual success toasts are already shown.
        // toast.success(`כל ${selectedFiles.length} הקבצים הועלו בהצלחה!`); // Optional summary
    }


    setUploading(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <Label htmlFor="file-upload-input" className="text-lg font-medium">העלאת קבצים</Label>
      <Input 
        id="file-upload-input" 
        type="file" 
        multiple // Allow multiple file selection
        onChange={handleFileChange} 
        disabled={uploading} 
        className="cursor-pointer"
        ref={fileInputRef}
      />
      {selectedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">קבצים שנבחרו ({selectedFiles.length}):</p>
          <ul className="list-disc pl-5 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <li key={index} className="truncate" title={file.name}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading} className="w-full sm:w-auto">
        {uploading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מעלה קבצים...
          </>
        ) : (
          <>
            <FileUp className="ml-2 h-4 w-4" /> 
            {selectedFiles.length > 1 ? `העלה ${selectedFiles.length} קבצים` : 'העלה קובץ'}
          </>
        )}
      </Button>
    </div>
  );
};

export default ClientFileUploader;
