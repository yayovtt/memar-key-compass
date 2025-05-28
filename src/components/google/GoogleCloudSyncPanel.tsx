
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  PlayCircle, 
  PauseCircle, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useGoogleCloudSync } from '@/hooks/useGoogleCloudSync';

interface GoogleCloudSyncPanelProps {
  clientId?: string;
}

const GoogleCloudSyncPanel: React.FC<GoogleCloudSyncPanelProps> = ({ clientId }) => {
  const {
    syncStatus,
    isAuthenticated,
    isSyncing,
    enableSync,
    disableSync,
    syncClientFiles,
    syncAllClientFiles
  } = useGoogleCloudSync(clientId);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'מעולם לא סונכרן';
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSyncStatusBadge = () => {
    if (!isAuthenticated) {
      return <Badge variant="destructive">לא מחובר</Badge>;
    }
    if (!syncStatus.isEnabled) {
      return <Badge variant="secondary">מושבת</Badge>;
    }
    if (isSyncing) {
      return <Badge variant="default">מסנכרן...</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">פעיל</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Cloud className="ml-2 h-6 w-6" />
            סנכרון Google Cloud
            {getSyncStatusBadge()}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            {syncStatus.isEnabled ? (
              <Button variant="outline" size="sm" onClick={disableSync} disabled={isSyncing}>
                <PauseCircle className="ml-1 h-4 w-4" />
                השבת סנכרון
              </Button>
            ) : (
              <Button size="sm" onClick={enableSync} disabled={isSyncing}>
                <PlayCircle className="ml-1 h-4 w-4" />
                הפעל סנכרון
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">קבצים סונכרנו</p>
              <p className="text-xl font-bold">{syncStatus.totalSynced}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">סנכרון אחרון</p>
              <p className="text-sm font-medium">{formatLastSync(syncStatus.lastSync)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">שגיאות</p>
              <p className="text-xl font-bold">{syncStatus.syncErrors.length}</p>
            </div>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">מסנכרן קבצים...</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Sync Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientId ? (
            <Button 
              onClick={() => syncClientFiles(clientId)} 
              disabled={!syncStatus.isEnabled || isSyncing || !isAuthenticated}
              className="w-full"
            >
              <Cloud className="ml-2 h-4 w-4" />
              סנכרן קבצי לקוח זה
            </Button>
          ) : (
            <Button 
              onClick={syncAllClientFiles} 
              disabled={!syncStatus.isEnabled || isSyncing || !isAuthenticated}
              className="w-full"
            >
              <Cloud className="ml-2 h-4 w-4" />
              סנכרן כל הקבצים
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => window.open('https://drive.google.com', '_blank')}
            className="w-full"
          >
            <BarChart3 className="ml-2 h-4 w-4" />
            פתח Google Drive
          </Button>
        </div>

        {/* Error Messages */}
        {syncStatus.syncErrors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">שגיאות סנכרון אחרונות:</p>
                {syncStatus.syncErrors.slice(-3).map((error, index) => (
                  <p key={index} className="text-sm text-muted-foreground">• {error}</p>
                ))}
                {syncStatus.syncErrors.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    ו-{syncStatus.syncErrors.length - 3} שגיאות נוספות...
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Status */}
        {!isAuthenticated && (
          <Alert>
            <Cloud className="h-4 w-4" />
            <AlertDescription>
              עליך להתחבר לGoogle Drive כדי להפעיל סנכרון אוטומטי של הקבצים.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCloudSyncPanel;
