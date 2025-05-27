
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const clientSchema = z.object({
  name: z.string().min(2, { message: "שם חייב להכיל לפחות 2 תווים." }),
  email: z.string().email({ message: "כתובת אימייל לא תקינה." }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientFormProps {
  setOpen: (open: boolean) => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ setOpen }) => {
  const queryClient = useQueryClient();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const { data: userSession } = await supabase.auth.getUser();
      if (!userSession?.user) {
        toast.error("עליך להיות מחובר כדי להוסיף לקוח.");
        // Potentially redirect to login or show login modal
        return;
      }

      const { error } = await supabase.from('clients').insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          // created_by_user_id will be set by default RLS policy if user is authenticated
        },
      ]);

      if (error) {
        console.error('Error inserting client:', error);
        toast.error(`שגיאה בהוספת לקוח: ${error.message}`);
      } else {
        toast.success('לקוח נוסף בהצלחה!');
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        setOpen(false);
        form.reset();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('אירעה שגיאה לא צפויה.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מלא</FormLabel>
              <FormControl>
                <Input placeholder="שם הלקוח" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>אימייל</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@mail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>טלפון</FormLabel>
              <FormControl>
                <Input placeholder="050-1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>כתובת</FormLabel>
              <FormControl>
                <Textarea placeholder="כתובת הלקוח" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'מוסיף...' : 'הוסף לקוח'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddClientForm;
