
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderUp, Eye } from 'lucide-react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FolderContentViewer from './FolderContentViewer';
import type { BulkClientFolderUploaderProps } from '@/types/bulkUpload';

const BulkClientFolderUploader: React.FC<BulkClientFolderUploaderProps> = ({ onUploadComplete }) => {
  const [selectedRootFolder, setSelectedRootFolder] = useState<FileList | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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
    <div className="space-y-4 p-4 border rounded-lg bg-card mb-6" dir="rtl">
      <Label htmlFor="bulk-folder-upload-input" className="text-lg font-medium">העלאת תיקיות לקוחות</Label>
      <p className="text-sm text-muted-foreground">
        בחר תיקייה ראשית המכילה תיקיות לקוחות. כל תת-תיקייה ישירה בתוכה תטופל כתיקיית לקוח.
        ניתן לבחור תיקיות מרובות בבת אחת על ידי לחיצה על Ctrl/Cmd ובחירת תיקיות נוספות.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <Input
          id="bulk-folder-upload-input"
          type="file"
          // @ts-expect-error webkitdirectory is a non-standard attribute but widely supported
          webkitdirectory=""
          multiple
          directory=""
          onChange={handleFileChange}
          disabled={uploading}
          className="cursor-pointer file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 flex-grow"
          ref={fileInputRef}
          title="בחר תיקיות המכילות את קבצי הלקוחות"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedRootFolder && selectedRootFolder.length > 0 && (
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={uploading} className="shrink-0">
                  <Eye className="ml-2 h-4 w-4" />
                  צפה בתוכן
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>תוכן התיקיות שנבחרו</DialogTitle>
                </DialogHeader>
                <FolderContentViewer files={selectedRootFolder} />
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={handleUpload} disabled={!selectedRootFolder || selectedRootFolder.length === 0 || uploading} className="shrink-0">
            {uploading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מעלה ומעבד...
              </>
            ) : (
              <>
                <FolderUp className="ml-2 h-4 w-4" />
                העלה תיקיות
              </>
            )}
          </Button>
        </div>
      </div>
      {selectedDirName && !uploading && (
        <div className="text-sm text-muted-foreground mt-2">
          <p className="font-medium">
            תיקייה ראשית נבחרה: {selectedDirName} ({selectedRootFolder?.length} קבצים ותתי-תיקיות)
          </p>
          <p className="text-xs">המערכת תחפש תתי-תיקיות ישירות ותתייחס אליהן כתיקיות לקוח.</p>
        </div>
      )}
    </div>
  );
};

export default BulkClientFolderUploader;
