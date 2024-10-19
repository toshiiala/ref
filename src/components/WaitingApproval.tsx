import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WaitingApprovalProps {
  authCode: string;
  onAuthSuccess: (token: string) => void;
  onAuthFailure: () => void;
}

const WaitingApproval: React.FC<WaitingApprovalProps> = ({ authCode, onAuthSuccess, onAuthFailure }) => {
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`/check-auth/${authCode}`);
        setStatus(response.data.status);

        if (response.data.status === 'accepted') {
          onAuthSuccess(response.data.token);
        } else if (response.data.status === 'rejected' || response.data.status === 'expired') {
          onAuthFailure();
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('An error occurred while checking authentication status');
        onAuthFailure();
      }
    };

    const interval = setInterval(checkAuth, 2000);

    return () => clearInterval(interval);
  }, [authCode, onAuthSuccess, onAuthFailure]);

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="animate-pulse">
            <p className="text-lg font-semibold">Waiting for approval...</p>
            <p className="text-sm text-gray-500">Please check your Telegram for authentication request</p>
          </div>
        );
      case 'rejected':
        return <p className="text-red-500">Authentication rejected</p>;
      case 'expired':
        return <p className="text-yellow-500">Authentication request expired</p>;
      default:
        return null;
    }
  };

  return (
    <div className="text-center">
      {renderContent()}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default WaitingApproval;
