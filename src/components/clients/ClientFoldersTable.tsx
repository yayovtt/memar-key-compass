
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, FileText, Users, HardDrive } from 'lucide-react';

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
}

interface ClientFoldersTableProps {
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

const ClientFoldersTable: React.FC<ClientFoldersTableProps> = ({ clientsWithFolders, allFiles }) => {
  const getClientStats = (clientId: string) => {
    const clientFiles = allFiles.filter(file => file.client_id === clientId);
    const totalFiles = clientFiles.length;
    const totalSize = clientFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
    
    return { totalFiles, totalSize };
  };

  const getFolderStats = (clientId: string, folderName: string) => {
    const folderFiles = allFiles.filter(file => {
      if (file.client_id !== clientId) return false;
      const segments = file.storage_path.split('/');
      return segments.length > 3 && segments[2] === folderName;
    });
    
    const fileCount = folderFiles.length;
    const folderSize = folderFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
    
    return { fileCount, folderSize };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="ml-2 h-5 w-5" />
          רשימת לקוחות ותיקיות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם הלקוח</TableHead>
              <TableHead className="text-right">תיקיות</TableHead>
              <TableHead className="text-right">סה"כ קבצים</TableHead>
              <TableHead className="text-right">גודל כולל</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsWithFolders.map(client => {
              const clientStats = getClientStats(client.id);
              
              return (
                <React.Fragment key={client.id}>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Users className="ml-2 h-4 w-4 text-primary" />
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Folder className="ml-2 h-4 w-4 text-yellow-500" />
                        {client.folders.length} תיקיות
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="ml-2 h-4 w-4 text-blue-500" />
                        {clientStats.totalFiles}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <HardDrive className="ml-2 h-4 w-4 text-green-500" />
                        {formatFileSize(clientStats.totalSize)}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {client.folders.map(folderName => {
                    const folderStats = getFolderStats(client.id, folderName);
                    
                    return (
                      <TableRow key={`${client.id}-${folderName}`} className="border-r-4 border-r-primary/20">
                        <TableCell className="pr-8">
                          <div className="flex items-center text-muted-foreground">
                            └── {folderName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">תיקיה</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <FileText className="ml-2 h-3 w-3 text-blue-400" />
                            {folderStats.fileCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <HardDrive className="ml-2 h-3 w-3 text-green-400" />
                            {formatFileSize(folderStats.folderSize)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {client.folders.length === 0 && (
                    <TableRow className="border-r-4 border-r-muted/20">
                      <TableCell className="pr-8 text-muted-foreground text-sm" colSpan={4}>
                        אין תיקיות עבור לקוח זה
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        
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

export default ClientFoldersTable;
