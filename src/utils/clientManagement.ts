
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getOrCreateClient = async (clientName: string, userId: string): Promise<string | null> => {
  console.log('[BulkUploader] getOrCreateClient: Attempting for clientName:', clientName, 'userId:', userId);
  let { data: existingClient, error: fetchError } = await supabase
    .from('clients')
    .select('id')
    .eq('name', clientName)
    .eq('created_by_user_id', userId) 
    .single();
  console.log('[BulkUploader] getOrCreateClient: existingClient query result:', { existingClient, fetchError });

  if (fetchError && fetchError.code !== 'PGRST116') { 
    toast.error(`שגיאה בבדיקת לקוח קיים "${clientName}": ${fetchError.message}`);
    return null;
  }

  if (existingClient) {
    console.log('[BulkUploader] getOrCreateClient: Found existing client ID:', existingClient.id);
    return existingClient.id;
  }

  console.log('[BulkUploader] getOrCreateClient: No existing client found, creating new one.');
  const { data: newClient, error: insertError } = await supabase
    .from('clients')
    .insert({ name: clientName, created_by_user_id: userId })
    .select('id')
    .single();
  console.log('[BulkUploader] getOrCreateClient: newClient query result:', { newClient, insertError });

  if (insertError) {
    toast.error(`שגיאה ביצירת לקוח חדש "${clientName}": ${insertError.message}`);
    return null;
  }
  if (!newClient) {
      toast.error(`לא הצלחנו ליצור לקוח חדש "${clientName}".`);
      return null;
  }
  toast.success(`לקוח חדש "${clientName}" נוצר בהצלחה.`);
  console.log('[BulkUploader] getOrCreateClient: Created new client ID:', newClient.id);
  return newClient.id;
};
