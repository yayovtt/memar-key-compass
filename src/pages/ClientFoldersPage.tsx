import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, Users, AlertTriangle, ServerCrash, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
  // other client fields if needed
}

interface ClientFile {
  id: string;
  client_id: string;
  storage_path: string;
  // other file fields if needed
}

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};

const fetchClientFiles = async (clientId: string): Promise<ClientFile[]> => {
  const { data, error } = await supabase
    .from('client_files')
    .select('id, client_id, storage_path')
    .eq('client_id', clientId);
  if (error) throw error;
  return data || [];
};

const extractFolders = (files: ClientFile[], clientId: string): string[] => {
  const folderSet = new Set<string>();
  // The storage_path is expected to be like 'clientId/folderName/fileName.ext'
  // or 'clientId/fileName.ext'
  // We need to make sure we are only processing paths for the correct client,
  // although fetchClientFiles should already guarantee this.
  const prefix = `${clientId}/`;

  files.forEach(file => {
    if (file.storage_path.startsWith(prefix)) {
      const relativePath = file.storage_path.substring(prefix.length);
      const segments = relativePath.split('/');
      // If segments.length > 1, it means there's at least one folder level.
      // e.g., "MyFolder/doc.txt" -> segments = ["MyFolder", "doc.txt"]
      // e.g., "guid.pdf" -> segments = ["guid.pdf"]
      if (segments.length > 1 && segments[0]) { 
        folderSet.add(segments[0]);
      }
    }
  });
  return Array.from(folderSet).sort((a, b) => a.localeCompare(b, 'he'));
};

const ClientFoldersPage: React.FC = () => {
  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useQuery<Client[], Error>({
    queryKey: ['allClientsForFolders'],
    queryFn: fetchClients,
  });

  // This will fetch files for ALL clients. This can be numerous requests and might be slow.
  // Consider a dedicated Supabase function (RPC) for performance with many clients/files.
  const clientFilesQueries = useMemo(() => {
    return (clients || []).map(client => ({
      queryKey: ['clientFilesForFolders', client.id],
      queryFn: () => fetchClientFiles(client.id),
      enabled: !!clients, // only run if clients are loaded
    }));
  }, [clients]);

  // This is a way to use useQuery for multiple dynamic queries, but it's not directly supported by tanstack/react-query like this.
  // For simplicity here, we'll process this manually, but `useQueries` hook is the proper way.
  // However, `useQueries` itself needs to be imported and setup.
  // Let's show a loading state while any file query is loading.
  // This is a simplified placeholder for fetching files for all clients. A robust solution would use `useQueries`.
  
  // For a more direct approach without `useQueries` yet, this example will be less efficient
  // and might not show granular loading states per client properly.
  // Let's assume for this example we'll fetch all files and then group them client-side.
  // This is NOT ideal for performance.
  const { data: allFiles, isLoading: isLoadingAllFiles, error: allFilesError } = useQuery<ClientFile[], Error>({
    queryKey: ['allClientFilesForFolderPage'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('client_files')
            .select('id, client_id, storage_path');
        if (error) throw error;
        return data || [];
    },
    enabled: !!clients && !isLoadingClients, // Fetch files only after clients are loaded
  });

  const clientsWithFolders = useMemo(() => {
    if (!clients || !allFiles) return [];
    return clients.map(client => {
      const filesForThisClient = allFiles.filter(file => file.client_id === client.id);
      const folders = extractFolders(filesForThisClient, client.id);
      return { ...client, folders };
    });
  }, [clients, allFiles]);


  if (isLoadingClients) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-6">תיקיות לקוחות</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <Header />
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center justify-center">
                    <AlertTriangle size={28} className="ml-2" /> שגיאה
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>אירעה שגיאה בטעינת רשימת הלקוחות:</p>
                <p className="text-sm text-muted-foreground">{clientsError.message}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">נסה שוב</Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!clients || clients.length === 0) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto text-center">
          <h1 className="text-3xl font-bold text-primary mb-6">תיקיות לקוחות</h1>
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <p>לא נמצאו לקוחות.</p>
          <Link to="/clients">
            <Button variant="link" className="mt-2">חזור לניהול לקוחות</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center sm:text-right">תיקיות לקוחות</h1>
        {isLoadingAllFiles && !clientsError && (
             <div className="text-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">טוען מידע על תיקיות...</p>
            </div>
        )}
        {allFilesError && !clientsError && (
             <Card className="w-full max-w-lg mx-auto text-center my-8">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center justify-center">
                        <ServerCrash size={28} className="ml-2" /> שגיאת נתונים
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>אירעה שגיאה בטעינת קבצי הלקוחות:</p>
                    <p className="text-sm text-muted-foreground">{allFilesError.message}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">נסה שוב</Button>
                </CardContent>
            </Card>
        )}
        {!isLoadingAllFiles && !allFilesError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientsWithFolders.map(client => (
                <Card key={client.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                    <Users className="ml-2 h-5 w-5 text-primary" />
                    {client.name}
                    </CardTitle>
                    <CardDescription>סה"כ תיקיות: {client.folders.length}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    {client.folders.length > 0 ? (
                    <ul className="space-y-2">
                        {client.folders.map(folderName => (
                        <li key={folderName} className="flex items-center p-2 bg-muted/30 rounded-md">
                            <Folder className="ml-2 h-5 w-5 text-yellow-500" />
                            <span className="font-medium">{folderName}</span>
                            {/* Future: Link to view folder contents */}
                            {/* <Link to={`/clients/${client.id}/folders/${folderName}`} className="mr-auto">
                                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </Link> */}
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">אין תיקיות עבור לקוח זה.</p>
                    )}
                </CardContent>
                </Card>
            ))}
            </div>
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default ClientFoldersPage;
