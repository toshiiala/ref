import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WaitingApproval from './WaitingApproval';

const Auth: React.FC<{ setIsAuthenticated: (value: boolean) => void }> = ({ setIsAuthenticated }) => {
  const [authKey, setAuthKey] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Sending auth request...');
      const response = await axios.post('/telegram-auth', { authKey });
      console.log('Auth response:', response.data);
      setAuthCode(response.data.authCode);
      setIsWaiting(true);
    } catch (err) {
      console.error('Auth error:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred during authentication');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleAuthSuccess = (token: string) => {
    console.log('Authentication successful, token:', token);
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleAuthFailure = () => {
    console.log('Authentication failed');
    setIsWaiting(false);
    setError('Authentication was rejected or expired. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to ToshiRef
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your ultimate referral management platform
          </p>
        </div>
        {isWaiting ? (
          <WaitingApproval authCode={authCode} onAuthSuccess={handleAuthSuccess} onAuthFailure={handleAuthFailure} />
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="authKey" className="sr-only">
                  Authentication Key
                </label>
                <input
                  id="authKey"
                  name="authKey"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter Authentication Key"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Authenticate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
