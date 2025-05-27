import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import ClientFolderCard from '@/components/clients/ClientFolderCard';
import ClientFoldersPageStatus from '@/components/clients/ClientFoldersPageStatus';

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

const extractFolders = (files: ClientFile[], clientId: string): string[] => {
  const folderSet = new Set<string>();
  const prefix = `${clientId}/`;

  files.forEach(file => {
    if (file.storage_path.startsWith(prefix)) {
      const relativePath = file.storage_path.substring(prefix.length);
      const segments = relativePath.split('/');
      if (segments.length > 1 && segments[0]) { 
        folderSet.add(segments[0]);
      }
    }
  });
  return Array.from(folderSet).sort((a, b) => a.localeCompare(b, 'he'));
};

const ClientFoldersPage: React.FC = () => {
  const { data: clients, isLoading: isLoadingClients, error: clientsError, isFetched: isClientsFetched } = useQuery<Client[], Error>({
    queryKey: ['allClientsForFolders'],
    queryFn: fetchClients,
  });
  
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

  const pageStatus = (
    <ClientFoldersPageStatus
      isLoadingClients={isLoadingClients}
      clientsError={clientsError}
      clientsCount={clients?.length}
      isLoadingAllFiles={isLoadingAllFiles}
      allFilesError={allFilesError}
      hasFetchedClients={isClientsFetched}
    />
  );

  const shouldShowContent = !isLoadingClients && !clientsError && (clients?.length ?? 0) > 0 && !isLoadingAllFiles && !allFilesError;

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center sm:text-right">תיקיות לקוחות</h1>
        
        {pageStatus}

        {shouldShowContent && clientsWithFolders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientsWithFolders.map(client => (
                <ClientFolderCard key={client.id} client={client} />
            ))}
            </div>
        )}
         {/* Handles case where clients exist, files loaded, but clientsWithFolders is empty (e.g. no folders for any client) */}
         {shouldShowContent && clientsWithFolders.length === 0 && (clients?.length ?? 0) > 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">לא נמצאו תיקיות עבור הלקוחות הקיימים.</p>
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
