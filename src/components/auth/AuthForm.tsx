
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  email: z.string().email({ message: 'כתובת אימייל לא תקינה.' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים.' }),
});

type AuthFormData = z.infer<typeof formSchema>;

interface AuthFormProps {
  isSignUp?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isSignUp = false }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const form = useForm<AuthFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('הרשמה בוצעה בהצלחה! בדוק את האימייל שלך לאימות החשבון.');
        // Supabase sends a confirmation email by default.
        // You might want to redirect to a "check your email" page or login.
        navigate('/'); // Or show a message to check email
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('התחברת בהצלחה!');
        navigate('/'); // Redirect to home or dashboard after login
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.error_description || error.message || 'אירעה שגיאה באימות.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{isSignUp ? 'הרשמה' : 'התחברות'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'צור חשבון חדש כדי להמשיך.' : 'הזן את פרטיך כדי להתחבר לחשבונך.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...form.register('email')}
              disabled={loading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              disabled={loading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isSignUp ? 'יוצר חשבון...' : 'מתחבר...') : (isSignUp ? 'הירשם' : 'התחבר')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AuthForm;
