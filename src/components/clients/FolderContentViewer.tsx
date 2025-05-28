
import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, File, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FolderContentViewerProps {
  files: FileList;
}

interface FolderStructure {
  [clientName: string]: {
    folders: { [folderName: string]: File[] };
    rootFiles: File[];
  };
}

const FolderContentViewer: React.FC<FolderContentViewerProps> = ({ files }) => {
  const folderStructure = useMemo(() => {
    const structure: FolderStructure = {};
    
    Array.from(files).forEach(file => {
      if (file.webkitRelativePath) {
        const segments = file.webkitRelativePath.split('/');
        if (segments.length > 1) {
          const clientName = segments[0];
          
          if (!structure[clientName]) {
            structure[clientName] = { folders: {}, rootFiles: [] };
          }
          
          if (segments.length === 2) {
            // קובץ ישירות תחת תיקיית הלקוח
            structure[clientName].rootFiles.push(file);
          } else if (segments.length > 2) {
            // קובץ בתוך תת-תיקייה
            const folderName = segments[1];
            if (!structure[clientName].folders[folderName]) {
              structure[clientName].folders[folderName] = [];
            }
            structure[clientName].folders[folderName].push(file);
          }
        }
      }
    });
    
    return structure;
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollArea className="h-[60vh] w-full" dir="rtl">
      <div className="space-y-4">
        {Object.entries(folderStructure).map(([clientName, clientData]) => {
          const totalFiles = clientData.rootFiles.length + 
            Object.values(clientData.folders).reduce((acc, files) => acc + files.length, 0);
          const totalFolders = Object.keys(clientData.folders).length;
          
          return (
            <Card key={clientName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="ml-2 h-5 w-5 text-primary" />
                    {clientName}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {totalFolders} תיקיות
                    </Badge>
                    <Badge variant="secondary">
                      {totalFiles} קבצים
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* קבצים בשורש */}
                {clientData.rootFiles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">קבצים בשורש:</h4>
                    <div className="grid gap-1">
                      {clientData.rootFiles.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-muted/30 rounded text-sm">
                          <File className="ml-2 h-4 w-4 text-blue-500" />
                          <span className="flex-grow">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* תת-תיקיות */}
                {Object.entries(clientData.folders).map(([folderName, folderFiles]) => (
                  <div key={folderName}>
                    <div className="flex items-center mb-2">
                      <Folder className="ml-2 h-4 w-4 text-yellow-500" />
                      <h4 className="font-medium text-sm">{folderName}</h4>
                      <Badge variant="outline" className="mr-2 text-xs">
                        {folderFiles.length} קבצים
                      </Badge>
                    </div>
                    <div className="grid gap-1 pr-6">
                      {folderFiles.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-muted/20 rounded text-sm">
                          <File className="ml-2 h-3 w-3 text-blue-400" />
                          <span className="flex-grow">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default FolderContentViewer;
