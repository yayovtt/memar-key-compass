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
  storage_path: string; // Example: USER_ID/CLIENT_ID/folder_name/file.txt
}

const fetchClients = async (): Promise<Client[]> => {
  const { data: userSession } = await supabase.auth.getUser();
  if (!userSession?.user) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('created_by_user_id', userSession.user.id) // Fetch only clients owned by the current user
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};

const fetchAllClientFiles = async (): Promise<ClientFile[]> => {
  const { data: userSession } = await supabase.auth.getUser();
  if (!userSession?.user) return [];

  // RLS policy on `client_files` table ensures user can only see files of clients they own.
  // `get_client_owner_id(client_id)` checks ownership.
  const { data, error } = await supabase
        .from('client_files')
        .select('id, client_id, storage_path')
        .eq('user_id', userSession.user.id); // Ensure we only fetch files linked to the current user
  if (error) throw error;
  return data || [];
};

const extractFolders = (files: ClientFile[], clientId: string): string[] => {
  const folderSet = new Set<string>();
  
  files.forEach(file => {
    // Expected storage_path format: USER_ID/CLIENT_ID/FOLDER_NAME/file.ext
    // or USER_ID/CLIENT_ID/file.ext (if file is directly under client, no subfolder)
    const segments = file.storage_path.split('/');
    
    // segments[0] should be USER_ID (we don't strictly check it here as files are already filtered by user)
    // segments[1] should be CLIENT_ID
    // segments[2] (if exists) is the FOLDER_NAME
    // segments[3] (if exists) is the actual file name or deeper path

    if (segments.length > 2 && segments[1] === clientId && segments[2]) {
      // Check if segments[1] (the client ID from path) matches the current clientId.
      // segments[2] is the top-level folder name within that client's specific path.
      // If segments.length is exactly 3 (e.g., USER_ID/CLIENT_ID/file.txt), segments[2] is a file, not a folder.
      // So we need segments.length > 3 for USER_ID/CLIENT_ID/FOLDER/file.txt
      // Or if segments.length == 3, it means USER_ID/CLIENT_ID/file_in_root_of_client_storage
      // The original logic `if (segments.length > 1 && segments[0])` on `relativePath` meant `CLIENT_ID/FOLDER/file.txt`
      // Now path is `USER_ID/CLIENT_ID/FOLDER/file.txt`. So, we need `segments.length > 3` to have a folder.
      // And `segments[2]` would be the folder name.
      
      // If path is USER_ID/CLIENT_ID/file.txt, then segments = [USER_ID, CLIENT_ID, file.txt]. length = 3. No folder.
      // If path is USER_ID/CLIENT_ID/MyFolder/file.txt, then segments = [USER_ID, CLIENT_ID, MyFolder, file.txt]. length = 4. Folder is MyFolder.
      // If path is USER_ID/CLIENT_ID/MyFolder/SubFolder/file.txt, then segments = [USER_ID, CLIENT_ID, MyFolder, SubFolder, file.txt]. length = 5. Folder is MyFolder.
      if (segments.length > 3) { // Ensure there's at least one folder segment after USER_ID/CLIENT_ID
         folderSet.add(segments[2]);
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
    enabled: !!clients && !isLoadingClients, 
  });

  const clientsWithFolders = useMemo(() => {
    if (!clients || !allFiles) return [];
    return clients.map(client => {
      // Files are already filtered by user_id in fetchAllClientFiles due to RLS and explicit eq('user_id', ...)
      // Here we just need to ensure we are linking files to the correct client based on client_id from the file record.
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
