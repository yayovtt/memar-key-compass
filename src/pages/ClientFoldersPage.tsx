
import React from 'react';
import Header from '@/components/layout/Header';
import ClientFolderCard from '@/components/clients/ClientFolderCard';
import ClientFoldersPageStatus from '@/components/clients/ClientFoldersPageStatus';
import { useClientFoldersData } from '@/hooks/useClientFoldersData';
import { Loader2 } from 'lucide-react'; // Ensure Loader2 is imported if needed by status or directly

const ClientFoldersPage: React.FC = () => {
  const {
    clientsWithFolders,
    isLoadingClients,
    clientsError,
    clientsCount,
    isLoadingAllFiles,
    allFilesError,
    isClientsFetched,
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

  const shouldShowContent = !isLoadingClients && !clientsError && (clientsCount ?? 0) > 0 && !isLoadingAllFiles && !allFilesError;

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
         {shouldShowContent && clientsWithFolders.length === 0 && (clientsCount ?? 0) > 0 && (
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
