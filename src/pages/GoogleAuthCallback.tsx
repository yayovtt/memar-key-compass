
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract access token from URL fragment
    const urlFragment = window.location.hash.substring(1);
    const params = new URLSearchParams(urlFragment);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: decodeURIComponent(error)
      }, window.location.origin);
      window.close();
    } else if (accessToken) {
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        accessToken
      }, window.location.origin);
      window.close();
    } else {
      // If opened directly, navigate back
      navigate('/client-folders');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg">מעבד אימות Google...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
