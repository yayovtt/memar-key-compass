
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  user_id: string; // Uploader's ID
}

const fetchClientFiles = async (clientId: string): Promise<ClientFile[]> => {
  const { data, error } = await supabase
    .from('client_files')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const ClientFileList: React.FC<{ clientId: string }> = ({ clientId }) => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: files, isLoading, error, refetch } = useQuery<ClientFile[], Error>({
    queryKey: ['clientFiles', clientId],
    queryFn: () => fetchClientFiles(clientId),
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file: ClientFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('client_files_bucket')
        .remove([file.storage_path]);
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw new Error(`שגיאה במחיקת הקובץ מהאחסון: ${storageError.message}`);
      }
      // Delete from database
      const { error: dbError } = await supabase
        .from('client_files')
        .delete()
        .eq('id', file.id);
      if (dbError) {
        console.error('DB deletion error:', dbError);
        // Potentially try to restore if storage deletion was part of a transaction
        throw new Error(`שגיאה במחיקת מידע הקובץ: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      toast.success('הקובץ נמחק בהצלחה!');
      queryClient.invalidateQueries({ queryKey: ['clientFiles', clientId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'שגיאה במחיקת הקובץ.');
    },
  });

  const handleDownload = (file: ClientFile) => {
    const { data } = supabase.storage
      .from('client_files_bucket')
      .getPublicUrl(file.storage_path);
    
    if (data?.publicUrl) {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.setAttribute('download', file.file_name); // or any other extension
      link.setAttribute('target', '_blank'); // Open in new tab to avoid navigation issues
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info(`הורדת ${file.file_name} החלה...`);
    } else {
      toast.error('לא ניתן היה ליצור קישור הורדה.');
    }
  };

  if (isLoading || currentUserId === null) {
    return (
      <Card>
        <CardHeader><CardTitle>קבצים מצורפים</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>קבצים מצורפים</CardTitle></CardHeader>
        <CardContent className="text-destructive flex items-center">
          <AlertTriangle className="ml-2 h-5 w-5" />
          שגיאה בטעינת קבצים: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>קבצים מצורפים ({files?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.file_type || 'לא ידוע'} | {(file.file_size ? (file.file_size / 1024).toFixed(2) : '0')} KB | הועלה: {new Date(file.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                    <Download className="ml-1 h-4 w-4" />
                    הורד
                  </Button>
                  {currentUserId === file.user_id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${file.file_name}"?`)) {
                          deleteFileMutation.mutate(file);
                        }
                      }}
                      disabled={deleteFileMutation.isPending}
                    >
                      {deleteFileMutation.isPending && deleteFileMutation.variables?.id === file.id ? (
                        <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="ml-1 h-4 w-4" />
                      )}
                      מחק
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">אין קבצים מצורפים ללקוח זה.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientFileList;
