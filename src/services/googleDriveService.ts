import { supabase } from '@/integrations/supabase/client';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private clientId: string = '';
  private apiKey: string = '';

  async initialize() {
    // Get credentials from Supabase Edge Function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Calling get-google-credentials edge function...');
      
      // Call edge function to get Google credentials
      const { data, error } = await supabase.functions.invoke('get-google-credentials');
      
      if (error) {
        console.error('Error getting Google credentials:', error);
        throw new Error(`Failed to get Google Drive credentials: ${error.message}`);
      }
      
      if (!data || !data.clientId) {
        throw new Error('No Google credentials returned from server');
      }
      
      this.clientId = data.clientId;
      this.apiKey = data.apiKey;
      
      console.log('Successfully initialized Google Drive service with client ID:', this.clientId);
      
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Get current origin
      const currentOrigin = window.location.origin;
      console.log('Current origin for Google auth:', currentOrigin);
      
      const redirectUri = `${currentOrigin}/auth/google/callback`;
      console.log('Redirect URI:', redirectUri);
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
        `response_type=token&` +
        `access_type=online&` +
        `include_granted_scopes=true`;

      console.log('Opening Google auth URL:', authUrl);

      // Open popup for authentication
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Failed to open authentication popup. Please allow popups for this site.');
      }

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            console.log('Google auth popup was closed by user');
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);

        // Listen for messages from the popup
        const messageListener = (event: MessageEvent) => {
          console.log('Received message from popup:', event.data);
          console.log('Event origin:', event.origin);
          console.log('Window origin:', window.location.origin);
          
          if (event.origin !== window.location.origin) {
            console.log('Ignoring message from different origin:', event.origin);
            return;
          }
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup?.close();
            this.accessToken = event.data.accessToken;
            localStorage.setItem('google_drive_token', this.accessToken);
            console.log('Google Drive authentication successful');
            resolve(true);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup?.close();
            console.error('Google auth error:', event.data.error);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageListener);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!popup?.closed) {
            popup?.close();
          }
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      throw error;
    }
  }

  private async ensureAuthenticated() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('google_drive_token');
    }
    
    if (!this.accessToken) {
      const success = await this.authenticate();
      if (!success) throw new Error('Google Drive authentication required');
    }
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    await this.ensureAuthenticated();

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const folder = await response.json();
    return {
      id: folder.id,
      name: folder.name,
      webViewLink: folder.webViewLink
    };
  }

  async uploadFile(file: File, folderId?: string): Promise<GoogleDriveFile> {
    await this.ensureAuthenticated();

    const metadata = {
      name: file.name,
      ...(folderId && { parents: [folderId] })
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return await response.json();
  }

  async listFiles(folderId?: string, query?: string): Promise<GoogleDriveFile[]> {
    await this.ensureAuthenticated();

    let searchQuery = '';
    if (folderId) {
      searchQuery += `'${folderId}' in parents`;
    }
    if (query) {
      searchQuery += (searchQuery ? ' and ' : '') + `name contains '${query}'`;
    }

    const params = new URLSearchParams({
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,parents)',
      ...(searchQuery && { q: searchQuery })
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.ensureAuthenticated();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<void> {
    await this.ensureAuthenticated();

    const permission = {
      type: 'user',
      role,
      emailAddress: email
    };

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permission),
    });

    if (!response.ok) {
      throw new Error(`Failed to share file: ${response.statusText}`);
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken || !!localStorage.getItem('google_drive_token');
  }

  signOut() {
    this.accessToken = null;
    localStorage.removeItem('google_drive_token');
  }
}

export const googleDriveService = new GoogleDriveService();
