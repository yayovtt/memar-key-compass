
import React from 'react';
import Header from '@/components/layout/Header';
import ClientFoldersPageStatus from '@/components/clients/ClientFoldersPageStatus';
import ClientFilesAccordion from '@/components/clients/ClientFilesAccordion';
import BulkClientFolderUploader from '@/components/clients/BulkClientFolderUploader';
import GoogleDriveIntegration from '@/components/google/GoogleDriveIntegration';
import GoogleCloudSyncPanel from '@/components/google/GoogleCloudSyncPanel';
import { useClientFoldersData } from '@/hooks/useClientFoldersData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientFoldersPage: React.FC = () => {
  const {
    clientsWithFolders,
    isLoadingClients,
    clientsError,
    clientsCount,
    isLoadingAllFiles,
    allFilesError,
    isClientsFetched,
    allFiles,
  } = useClientFoldersData();

  const pageStatus = (
    <ClientFoldersPageStatus
      isLoadingClients={isLoadingClients}
      clientsError={clientsError}
      clientsCount={clientsCount}
      isLoadingAllFiles={isLoadingAllFiles}
      allFilesError={allFilesError}
      hasFetchedClients={isClientsFetched}
    />
  );

  const handleBulkUploadComplete = () => {
    console.log('Bulk upload process finished, data should be refetching.');
  };

  const shouldShowContent = !isLoadingClients && !clientsError && (clientsCount ?? 0) > 0 && !isLoadingAllFiles && !allFilesError;

  return (
    <div className="min-h-screen bg-secondary flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center sm:text-right">תיקיות לקוחות</h1>
        
        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local">ניהול מקומי</TabsTrigger>
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="sync">סנכרון ענן</TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="space-y-6">
            <BulkClientFolderUploader onUploadComplete={handleBulkUploadComplete} />
            {pageStatus}
            {shouldShowContent && (
              <ClientFilesAccordion 
                clientsWithFolders={clientsWithFolders} 
                allFiles={allFiles || []}
              />
            )}
          </TabsContent>
          
          <TabsContent value="google-drive" className="space-y-6">
            <div dir="rtl">
              <GoogleDriveIntegration />
            </div>
          </TabsContent>
          
          <TabsContent value="sync" className="space-y-6">
            <div dir="rtl">
              <GoogleCloudSyncPanel />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">הגדרות סנכרון</h3>
                  <p className="text-sm text-muted-foreground">
                    הסנכרון האוטומטי יעלה את כל הקבצים שלך לGoogle Drive וישמור אותם מסונכרנים.
                    הקבצים יאורגנו בתיקיות לפי שמות הלקוחות.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">יתרונות הסנכרון</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• גיבוי אוטומטי בענן</li>
                    <li>• גישה לקבצים מכל מקום</li>
                    <li>• שיתוף קל עם לקוחות</li>
                    <li>• ארגון אוטומטי בתיקיות</li>
                    <li>• גרסאות קבצים</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default ClientFoldersPage;
