
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  // Get clients count
  const { data: clientsCount = 0 } = useQuery({
    queryKey: ['clientsCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching clients count:', error);
        return 0;
      }
      
      return count || 0;
    },
  });

  // Get files count
  const { data: filesCount = 0 } = useQuery({
    queryKey: ['filesCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('client_files')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching files count:', error);
        return 0;
      }
      
      return count || 0;
    },
  });

  // Calculate some mock growth percentage based on current count
  const growthPercentage = Math.min(75 + (clientsCount * 2), 100);

  return {
    clientsCount,
    filesCount,
    growthPercentage: growthPercentage.toFixed(1),
    activeUsers: Math.max(clientsCount * 2, 15), // Mock calculation
    openTasks: Math.max(Math.floor(clientsCount / 5), 3), // Mock calculation
  };
};
