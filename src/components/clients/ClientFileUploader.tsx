
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UploadCloud, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ClientFileUploaderProps {
  clientId: string;
  onUploadSuccess: () => void;
}

const ClientFileUploader: React.FC<ClientFileUploaderProps> = ({ clientId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('אנא בחר קובץ להעלאה.');
      return;
    }

    setUploading(true);
    try {
      const { data: userSession, error: userError } = await supabase.auth.getUser();
      if (userError || !userSession?.user) {
        toast.error('שגיאת אימות. נסה להתחבר מחדש.');
        setUploading(false);
        return;
      }
      const userId = userSession.user.id;

      // Ensure filename is URL-safe and unique
      const fileExtension = selectedFile.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${clientId}/${uniqueFileName}`; // Store under client's folder

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client_files_bucket')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        throw new Error(`שגיאה בהעלאת קובץ לאחסון: ${uploadError.message}`);
      }

      // Insert file metadata into 'client_files' table
      const { error: dbError } = await supabase.from('client_files').insert({
        client_id: clientId,
        user_id: userId, // This is automatically set to auth.uid() by RLS default, but explicit is fine
        file_name: selectedFile.name,
        storage_path: filePath,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
      });

      if (dbError) {
        console.error('Error inserting file metadata to DB:', dbError);
        // Attempt to delete the orphaned file from storage if DB insert fails
        await supabase.storage.from('client_files_bucket').remove([filePath]);
        throw new Error(`שגיאה בשמירת מידע על הקובץ: ${dbError.message}`);
      }

      toast.success('הקובץ הועלה בהצלחה!');
      setSelectedFile(null); // Clear file input
      if (document.getElementById('file-upload-input')) {
        (document.getElementById('file-upload-input') as HTMLInputElement).value = "";
      }
      onUploadSuccess(); // Callback to refresh file list
    } catch (error: any) {
      console.error('Upload process error:', error);
      toast.error(error.message || 'אירעה שגיאה במהלך העלאת הקובץ.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <Label htmlFor="file-upload-input" className="text-lg font-medium">העלאת קובץ חדש</Label>
      <Input id="file-upload-input" type="file" onChange={handleFileChange} disabled={uploading} className="cursor-pointer" />
      {selectedFile && <p className="text-sm text-muted-foreground">קובץ נבחר: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>}
      <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full sm:w-auto">
        {uploading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מעלה קובץ...
          </>
        ) : (
          <>
            <UploadCloud className="ml-2 h-4 w-4" />
            העלה קובץ
          </>
        )}
      </Button>
    </div>
  );
};

export default ClientFileUploader;
