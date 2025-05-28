
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Users, FileText, HardDrive, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientWithFolders {
  id: string;
  name: string;
  folders: string[];
}

interface ClientFile {
  id: string;
  client_id: string;
  file_size: number | null;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
}

interface ClientFilesAccordionProps {
  clientsWithFolders: ClientWithFolders[];
  allFiles: ClientFile[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ClientFilesAccordion: React.FC<ClientFilesAccordionProps> = ({ clientsWithFolders, allFiles }) => {
  const getClientStats = (clientId: string) => {
    const clientFiles = allFiles.filter(file => file.client_id === clientId);
    const totalFiles = clientFiles.length;
    const totalSize = clientFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
    
    return { totalFiles, totalSize, files: clientFiles };
  };

  const handleFileClick = (file: ClientFile) => {
    const { data } = supabase.storage
      .from('client_files_bucket')
      .getPublicUrl(file.storage_path);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
      toast.info(`פותח את ${file.file_name}...`);
    } else {
      toast.error('לא ניתן היה לפתוח את הקובץ.');
    }
  };

  const handleDownload = (file: ClientFile, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const { data } = supabase.storage
      .from('client_files_bucket')
      .getPublicUrl(file.storage_path);
    
    if (data?.publicUrl) {
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.setAttribute('download', file.file_name);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info(`הורדת ${file.file_name} החלה...`);
    } else {
      toast.error('לא ניתן היה ליצור קישור הורדה.');
    }
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="ml-2 h-5 w-5" />
          רשימת לקוחות וקבצים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {clientsWithFolders.map(client => {
            const clientStats = getClientStats(client.id);
            
            return (
              <AccordionItem key={client.id} value={client.id}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full ml-4">
                    <div className="flex items-center">
                      <Users className="ml-2 h-4 w-4 text-primary" />
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <FileText className="ml-1 h-4 w-4 text-blue-500" />
                        {clientStats.totalFiles} קבצים
                      </div>
                      <div className="flex items-center">
                        <HardDrive className="ml-1 h-4 w-4 text-green-500" />
                        {formatFileSize(clientStats.totalSize)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {clientStats.files.length > 0 ? (
                    <div className="space-y-2 pr-6">
                      {clientStats.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleFileClick(file)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.file_type || 'לא ידוע'} | {formatFileSize(file.file_size || 0)} | {new Date(file.created_at).toLocaleDateString('he-IL')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDownload(file, e)}
                            className="flex-shrink-0"
                          >
                            <Download className="ml-1 h-4 w-4" />
                            הורד
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4 pr-6">
                      אין קבצים עבור לקוח זה
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        {clientsWithFolders.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">אין לקוחות להצגה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientFilesAccordion;
