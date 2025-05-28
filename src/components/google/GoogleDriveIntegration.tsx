
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Cloud, 
  CloudDownload, 
  CloudUpload, 
  Folder, 
  FileText, 
  Share, 
  Trash2, 
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { googleDriveService, type GoogleDriveFile, type DriveFolder } from '@/services/googleDriveService';

interface GoogleDriveIntegrationProps {
  clientId?: string;
  onFileSelect?: (file: GoogleDriveFile) => void;
}

const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({ 
  clientId, 
  onFileSelect 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthenticated(googleDriveService.isAuthenticated());
    if (googleDriveService.isAuthenticated()) {
      loadFiles();
    }
  }, []);

  const handleAuthenticate = async () => {
    setIsLoading(true);
    try {
      const success = await googleDriveService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        toast.success('התחברת בהצלחה לGoogle Drive!');
        await loadFiles();
      }
    } catch (error: any) {
      toast.error(`שגיאה בהתחברות: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    googleDriveService.signOut();
    setIsAuthenticated(false);
    setFiles([]);
    setCurrentFolder(null);
    toast.info('התנתקת מGoogle Drive');
  };

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const driveFiles = await googleDriveService.listFiles(currentFolder?.id);
      setFiles(driveFiles);
    } catch (error: any) {
      toast.error(`שגיאה בטעינת קבצים: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const uploadedFile = await googleDriveService.uploadFile(file, currentFolder?.id);
      toast.success(`הקובץ "${file.name}" הועלה בהצלחה לGoogle Drive!`);
      await loadFiles();
      
      // Clear the input
      event.target.value = '';
    } catch (error: any) {
      toast.error(`שגיאה בהעלאת הקובץ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('אנא הכנס שם לתיקייה');
      return;
    }

    setIsLoading(true);
    try {
      await googleDriveService.createFolder(newFolderName, currentFolder?.id);
      toast.success(`התיקייה "${newFolderName}" נוצרה בהצלחה!`);
      setNewFolderName('');
      await loadFiles();
    } catch (error: any) {
      toast.error(`שגיאה ביצירת התיקייה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את "${fileName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await googleDriveService.deleteFile(fileId);
      toast.success(`הקובץ "${fileName}" נמחק בהצלחה!`);
      await loadFiles();
    } catch (error: any) {
      toast.error(`שגיאה במחיקת הקובץ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareFile = async (fileId: string) => {
    if (!shareEmail.trim()) {
      toast.error('אנא הכנס כתובת אימייל');
      return;
    }

    setIsLoading(true);
    try {
      await googleDriveService.shareFile(fileId, shareEmail, 'reader');
      toast.success(`הקובץ שותף בהצלחה עם ${shareEmail}!`);
      setShareEmail('');
      setSelectedFileId(null);
    } catch (error: any) {
      toast.error(`שגיאה בשיתוף הקובץ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (size: string | undefined): string => {
    if (!size) return 'לא ידוע';
    const bytes = parseInt(size);
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('image')) return <FileText className="h-5 w-5 text-green-500" />;
    if (mimeType.includes('video')) return <FileText className="h-5 w-5 text-purple-500" />;
    if (mimeType.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="ml-2 h-6 w-6" />
            חיבור לGoogle Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            התחבר לGoogle Drive כדי לסנכרן ולנהל את הקבצים שלך בענן
          </p>
          <Button onClick={handleAuthenticate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Cloud className="ml-2 h-4 w-4" />
            )}
            התחבר לGoogle Drive
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="ml-2 h-6 w-6 text-green-500" />
            Google Drive
            <Badge variant="secondary" className="mr-2">מחובר</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            התנתק
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Folder */}
        {currentFolder && (
          <div className="flex items-center space-x-2 space-x-reverse p-2 bg-muted rounded">
            <Folder className="h-4 w-4" />
            <span className="font-medium">{currentFolder.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentFolder(null)}
            >
              חזור לתיקייה הראשית
            </Button>
          </div>
        )}

        {/* Upload and Create Folder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">העלאת קובץ</label>
            <Input
              type="file"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">יצירת תיקייה חדשה</label>
            <div className="flex space-x-2 space-x-reverse">
              <Input
                placeholder="שם התיקייה"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder} disabled={isLoading || !newFolderName.trim()}>
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">קבצים ({files.length})</h3>
            <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {getFileIcon(file.mimeType)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 space-x-reverse">
                  {file.mimeType === 'application/vnd.google-apps.folder' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentFolder({ 
                        id: file.id, 
                        name: file.name, 
                        webViewLink: file.webViewLink 
                      })}
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {file.webContentLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.webContentLink, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id, file.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {files.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="mx-auto h-12 w-12 mb-2" />
                <p>אין קבצים בתיקייה זו</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Dialog */}
        {selectedFileId && (
          <div className="p-4 border rounded bg-muted/30">
            <h4 className="font-medium mb-2">שיתוף קובץ</h4>
            <div className="flex space-x-2 space-x-reverse">
              <Input
                placeholder="כתובת אימייל"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                type="email"
              />
              <Button onClick={() => handleShareFile(selectedFileId)} disabled={!shareEmail.trim()}>
                שתף
              </Button>
              <Button variant="outline" onClick={() => setSelectedFileId(null)}>
                ביטול
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleDriveIntegration;
