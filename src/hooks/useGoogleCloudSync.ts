
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { googleDriveService, type GoogleDriveFile } from '@/services/googleDriveService';
import { toast } from 'sonner';

export interface SyncStatus {
  isEnabled: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  syncErrors: string[];
  totalSynced: number;
}

export const useGoogleCloudSync = (clientId?: string) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    lastSync: null,
    pendingUploads: 0,
    syncErrors: [],
    totalSynced: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsAuthenticated(googleDriveService.isAuthenticated());
  }, []);

  const enableSync = useCallback(async () => {
    if (!isAuthenticated) {
      try {
        const success = await googleDriveService.authenticate();
        if (success) {
          setIsAuthenticated(true);
          setSyncStatus(prev => ({ ...prev, isEnabled: true }));
          toast.success('סנכרון Google Drive הופעל!');
        }
      } catch (error: any) {
        toast.error(`שגיאה בהפעלת הסנכרון: ${error.message}`);
      }
    } else {
      setSyncStatus(prev => ({ ...prev, isEnabled: true }));
      toast.success('סנכרון Google Drive הופעל!');
    }
  }, [isAuthenticated]);

  const disableSync = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, isEnabled: false }));
    toast.info('סנכרון Google Drive הופסק');
  }, []);

  const syncClientFiles = useCallback(async (clientId: string) => {
    if (!syncStatus.isEnabled || !isAuthenticated) return;

    setIsSyncing(true);
    let syncedCount = 0;
    const errors: string[] = [];

    try {
      // Get client files from Supabase
      const { data: clientFiles, error } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;

      if (!clientFiles || clientFiles.length === 0) {
        toast.info('אין קבצים לסנכרון עבור הלקוח');
        return;
      }

      // Get client name for folder organization
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single();

      const clientName = client?.name || `Client_${clientId}`;

      // Create or find client folder in Google Drive
      let clientFolder: any;
      try {
        clientFolder = await googleDriveService.createFolder(clientName);
      } catch (error) {
        // Folder might already exist, try to find it
        const existingFolders = await googleDriveService.listFiles(undefined, clientName);
        clientFolder = existingFolders.find(f => f.mimeType === 'application/vnd.google-apps.folder');
        
        if (!clientFolder) {
          throw new Error(`Failed to create or find folder for client: ${clientName}`);
        }
      }

      // Upload each file to Google Drive
      for (const file of clientFiles) {
        try {
          // Download file from Supabase Storage
          const { data: fileData } = await supabase.storage
            .from('client_files_bucket')
            .download(file.storage_path);

          if (!fileData) {
            errors.push(`Failed to download file: ${file.file_name}`);
            continue;
          }

          // Convert blob to File object
          const fileBlob = new File([fileData], file.file_name, {
            type: file.file_type || 'application/octet-stream'
          });

          // Upload to Google Drive
          await googleDriveService.uploadFile(fileBlob, clientFolder.id);
          syncedCount++;

          // Update sync status in database (optional)
          await supabase
            .from('client_files')
            .update({ 
              // Add a google_drive_sync field if you want to track sync status
              updated_at: new Date().toISOString()
            })
            .eq('id', file.id);

        } catch (error: any) {
          errors.push(`Error syncing ${file.file_name}: ${error.message}`);
        }
      }

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        totalSynced: prev.totalSynced + syncedCount,
        syncErrors: errors
      }));

      if (syncedCount > 0) {
        toast.success(`${syncedCount} קבצים סונכרנו בהצלחה לGoogle Drive!`);
      }

      if (errors.length > 0) {
        toast.warning(`${errors.length} שגיאות סנכרון. בדוק את הלוג למידע נוסף.`);
      }

    } catch (error: any) {
      errors.push(`Sync failed: ${error.message}`);
      setSyncStatus(prev => ({ ...prev, syncErrors: errors }));
      toast.error(`שגיאה בסנכרון: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [syncStatus.isEnabled, isAuthenticated]);

  const syncAllClientFiles = useCallback(async () => {
    if (!syncStatus.isEnabled || !isAuthenticated) return;

    setIsSyncing(true);
    try {
      // Get all clients for the current user
      const { data: userSession } = await supabase.auth.getUser();
      if (!userSession?.user) throw new Error('User not authenticated');

      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('created_by_user_id', userSession.user.id);

      if (error) throw error;

      if (!clients || clients.length === 0) {
        toast.info('אין לקוחות לסנכרון');
        return;
      }

      // Sync each client's files
      for (const client of clients) {
        await syncClientFiles(client.id);
      }

      toast.success('כל הקבצים סונכרנו בהצלחה!');

    } catch (error: any) {
      toast.error(`שגיאה בסנכרון כללי: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [syncClientFiles, syncStatus.isEnabled, isAuthenticated]);

  return {
    syncStatus,
    isAuthenticated,
    isSyncing,
    enableSync,
    disableSync,
    syncClientFiles,
    syncAllClientFiles
  };
};
