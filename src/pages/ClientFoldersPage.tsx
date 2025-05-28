
import React from 'react';
import Header from '@/components/layout/Header';
import ClientFoldersPageStatus from '@/components/clients/ClientFoldersPageStatus';
import ClientFoldersTable from '@/components/clients/ClientFoldersTable';
import BulkClientFolderUploader from '@/components/clients/BulkClientFolderUploader';
import { useClientFoldersData } from '@/hooks/useClientFoldersData';

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
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center sm:text-right">תיקיות לקוחות</h1>
        
        <BulkClientFolderUploader onUploadComplete={handleBulkUploadComplete} />

        {pageStatus}

        {shouldShowContent && (
          <ClientFoldersTable 
            clientsWithFolders={clientsWithFolders} 
            allFiles={allFiles || []}
          />
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default ClientFoldersPage;
