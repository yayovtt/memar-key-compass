
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound } from 'lucide-react'; // Assuming this icon exists
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const ClientList: React.FC = () => {
  const { data: clients, isLoading, error } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">שגיאה בטעינת לקוחות: {error.message}</p>;
  }

  if (!clients || clients.length === 0) {
    return <p>לא נמצאו לקוחות. נסה להוסיף לקוח חדש!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Card key={client.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-semibold">{client.name}</CardTitle>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-grow">
            {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
            {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
            {client.address && <p className="text-sm text-muted-foreground mt-2">{client.address}</p>}
          </CardContent>
          {/* TODO: Add actions like Edit/Delete/View Files in CardFooter if needed */}
        </Card>
      ))}
    </div>
  );
};

export default ClientList;
