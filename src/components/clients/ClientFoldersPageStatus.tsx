
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Users, ServerCrash, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ClientFoldersPageStatusProps {
  isLoadingClients: boolean;
  clientsError: Error | null;
  clientsCount: number | undefined;
  isLoadingAllFiles: boolean;
  allFilesError: Error | null;
  hasFetchedClients: boolean; // To ensure we don't show file loading/error before clients attempt to load
}

const ClientFoldersPageStatus: React.FC<ClientFoldersPageStatusProps> = ({
  isLoadingClients,
  clientsError,
  clientsCount,
  isLoadingAllFiles,
  allFilesError,
  hasFetchedClients,
}) => {
  if (isLoadingClients) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle size={28} className="ml-2" /> שגיאה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>אירעה שגיאה בטעינת רשימת הלקוחות:</p>
            <p className="text-sm text-muted-foreground">{clientsError.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">נסה שוב</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasFetchedClients && !isLoadingClients && !clientsError && clientsCount === 0) {
    return (
      <div className="text-center">
        <Users size={48} className="mx-auto text-muted-foreground mb-4" />
        <p>לא נמצאו לקוחות.</p>
        <Link to="/clients">
          <Button variant="link" className="mt-2">חזור לניהול לקוחות</Button>
        </Link>
      </div>
    );
  }

  // Show these statuses only if clients have been fetched (or attempted) and no client-level error/empty state
  if (hasFetchedClients && !clientsError && (clientsCount ?? 0) > 0) {
    if (isLoadingAllFiles) {
      return (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">טוען מידע על תיקיות...</p>
        </div>
      );
    }

    if (allFilesError) {
      return (
        <Card className="w-full max-w-lg mx-auto text-center my-8">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <ServerCrash size={28} className="ml-2" /> שגיאת נתונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>אירעה שגיאה בטעינת קבצי הלקוחות:</p>
            <p className="text-sm text-muted-foreground">{allFilesError.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">נסה שוב</Button>
          </CardContent>
        </Card>
      );
    }
  }
  
  return null; // No status to show, content will be rendered
};

export default ClientFoldersPageStatus;
