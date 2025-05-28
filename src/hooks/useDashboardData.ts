
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

  // Get tasks count (open tasks)
  const { data: openTasks = 0 } = useQuery({
    queryKey: ['openTasksCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', false);
      
      if (error) {
        console.error('Error fetching open tasks count:', error);
        return 0;
      }
      
      return count || 0;
    },
  });

  // Get recent tasks for display
  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recentTasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('title, is_completed')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        console.error('Error fetching recent tasks:', error);
        return [];
      }
      
      return data || [];
    },
  });

  // Get recent reminders for display
  const { data: recentReminders = [] } = useQuery({
    queryKey: ['recentReminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('title, reminder_time, is_completed')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        console.error('Error fetching recent reminders:', error);
        return [];
      }
      
      return data || [];
    },
  });

  // Calculate some mock growth percentage based on current count
  const growthPercentage = Math.min(75 + (clientsCount * 2), 100);

  return {
    clientsCount,
    filesCount,
    growthPercentage: growthPercentage.toFixed(1),
    activeUsers: Math.max(clientsCount * 2, 15), // Mock calculation
    openTasks,
    recentTasks,
    recentReminders,
  };
};
