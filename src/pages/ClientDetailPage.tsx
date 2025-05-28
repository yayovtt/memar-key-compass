
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import ClientFileUploader from '@/components/clients/ClientFileUploader';
import ClientFileList from '@/components/clients/ClientFileList';
import GoogleDriveIntegration from '@/components/google/GoogleDriveIntegration';
import GoogleCloudSyncPanel from '@/components/google/GoogleCloudSyncPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, User, Mail, Phone, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
}

const fetchClientDetails = async (clientId: string): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching client details:', error);
    throw new Error(error.message);
  }
  return data;
};

const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!clientId) {
    navigate('/clients');
    return null;
  }

  const { data: client, isLoading, error, refetch } = useQuery<Client | null, Error>({
    queryKey: ['clientDetails', clientId],
    queryFn: () => fetchClientDetails(clientId),
  });

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clientFiles', clientId] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
          <Button variant="outline" onClick={() => navigate('/clients')} className="mb-6">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור לרשימת הלקוחות
          </Button>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto text-center">
           <Button variant="outline" onClick={() => navigate('/clients')} className="mb-6">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור לרשימת הלקוחות
          </Button>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">שגיאה</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-2">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <p>שגיאה בטעינת פרטי לקוח: {error.message}</p>
              <p>ייתכן שאין לך הרשאה לצפות בלקוח זה, או שהלקוח אינו קיים.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  if (!client) {
     return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto text-center">
           <Button variant="outline" onClick={() => navigate('/clients')} className="mb-6">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור לרשימת הלקוחות
          </Button>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>לקוח לא נמצא</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-2">
              <User className="h-12 w-12 text-muted-foreground" />
              <p>הלקוח המבוקש לא נמצא.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
        <Button variant="outline" onClick={() => navigate('/clients')} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          חזור לרשימת הלקוחות
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Client Details Card */}
          <Card className="md:col-span-1 self-start">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <User className="ml-3 h-7 w-7 text-primary" />
                {client.name}
              </CardTitle>
              <CardDescription>פרטי לקוח</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.email && (
                <div className="flex items-center">
                  <Mail className="ml-2 h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center">
                  <Phone className="ml-2 h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start">
                  <MapPin className="ml-2 h-4 w-4 text-muted-foreground mt-1" />
                  <span>{client.address}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2">
                נוצר בתאריך: {new Date(client.created_at).toLocaleDateString('he-IL')}
              </div>
            </CardContent>
          </Card>

          {/* File Management Section */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="local">ניהול מקומי</TabsTrigger>
                <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
                <TabsTrigger value="sync">סנכרון</TabsTrigger>
              </TabsList>
              
              <TabsContent value="local" className="space-y-6">
                <ClientFileUploader clientId={clientId} onUploadSuccess={handleUploadSuccess} />
                <ClientFileList clientId={clientId} />
              </TabsContent>
              
              <TabsContent value="google-drive" className="space-y-6">
                <GoogleDriveIntegration clientId={clientId} />
              </TabsContent>
              
              <TabsContent value="sync" className="space-y-6">
                <GoogleCloudSyncPanel clientId={clientId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default ClientDetailPage;
