
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Folder, Users } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Eye } from 'lucide-react'; // If you re-enable the view button

interface ClientWithFolders {
  id: string;
  name: string;
  folders: string[];
}

interface ClientFolderCardProps {
  client: ClientWithFolders;
}

const ClientFolderCard: React.FC<ClientFolderCardProps> = ({ client }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Users className="ml-2 h-5 w-5 text-primary" />
          {client.name}
        </CardTitle>
        <CardDescription>סה"כ תיקיות: {client.folders.length}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {client.folders.length > 0 ? (
          <ul className="space-y-2">
            {client.folders.map(folderName => (
              <li key={folderName} className="flex items-center p-2 bg-muted/30 rounded-md">
                <Folder className="ml-2 h-5 w-5 text-yellow-500" />
                <span className="font-medium">{folderName}</span>
                {/* Future: Link to view folder contents */}
                {/* <Link to={`/clients/${client.id}/folders/${folderName}`} className="mr-auto">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </Link> */}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">אין תיקיות עבור לקוח זה.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientFolderCard;
