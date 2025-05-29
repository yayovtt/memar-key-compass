
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Google Auth Callback page loaded');
    console.log('Current URL:', window.location.href);
    console.log('URL hash:', window.location.hash);
    
    // Extract access token from URL fragment
    const urlFragment = window.location.hash.substring(1);
    console.log('URL fragment:', urlFragment);
    
    const params = new URLSearchParams(urlFragment);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    console.log('Access token:', accessToken ? 'Found' : 'Not found');
    console.log('Error:', error);
    console.log('Error description:', errorDescription);

    if (error) {
      console.error('Google auth error:', error, errorDescription);
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: errorDescription || error
        }, window.location.origin);
        window.close();
      } else {
        // If opened directly, show error and navigate back
        alert(`שגיאה באימות Google: ${errorDescription || error}`);
        navigate('/client-folders');
      }
    } else if (accessToken) {
      console.log('Sending success message to parent window');
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          accessToken
        }, window.location.origin);
        window.close();
      } else {
        // If opened directly, store token and navigate back
        localStorage.setItem('google_drive_token', accessToken);
        navigate('/client-folders');
      }
    } else {
      console.log('No token or error found, redirecting...');
      // If opened directly, navigate back
      if (window.opener) {
        window.close();
      } else {
        navigate('/client-folders');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg">מעבד אימות Google...</p>
        <p className="text-sm text-muted-foreground mt-2">אם החלון לא נסגר אוטומטית, סגור אותו ידנית</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
