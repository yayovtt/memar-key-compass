
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
}

export interface ClientFile {
  id: string;
  client_id: string;
  storage_path: string;
}

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};

const fetchAllClientFiles = async (): Promise<ClientFile[]> => {
    const { data, error } = await supabase
        .from('client_files')
        .select('id, client_id, storage_path');
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

export const useClientFoldersData = () => {
  const { 
    data: clients, 
    isLoading: isLoadingClients, 
    error: clientsError, 
    isFetched: isClientsFetched 
  } = useQuery<Client[], Error>({
    queryKey: ['allClientsForFolders'],
    queryFn: fetchClients,
  });
  
  const { 
    data: allFiles, 
    isLoading: isLoadingAllFiles, 
    error: allFilesError 
  } = useQuery<ClientFile[], Error>({
    queryKey: ['allClientFilesForFolderPage'],
    queryFn: fetchAllClientFiles,
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

  return {
    clientsWithFolders,
    isLoadingClients,
    clientsError,
    clientsCount: clients?.length,
    isLoadingAllFiles,
    allFilesError,
    isClientsFetched,
  };
};
