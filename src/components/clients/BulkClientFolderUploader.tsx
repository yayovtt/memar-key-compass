
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderUp } from 'lucide-react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import type { BulkClientFolderUploaderProps } from '@/types/bulkUpload';

const BulkClientFolderUploader: React.FC<BulkClientFolderUploaderProps> = ({ onUploadComplete }) => {
  const [selectedRootFolder, setSelectedRootFolder] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadFiles } = useBulkUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRootFolder(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedRootFolder) return;
    
    await uploadFiles(selectedRootFolder, onUploadComplete);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedRootFolder(null);
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
