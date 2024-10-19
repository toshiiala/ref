import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Link as LinkIcon, Copy, Check, Save } from 'lucide-react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [solanaAddress, setSolanaAddress] = useState('');
  const [invitationLink] = useState('https://t.me/toshilabsbot/trade?startapp=degencalls');
  const [invitedUsers, setInvitedUsers] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [copied, setCopied] = useState(false);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const invitedQuery = query(usersRef, where('invitedBy', '==', 'degencalls'));
        const invitedSnapshot = await getDocs(invitedQuery);
        
        const invitedCount = invitedSnapshot.size;
        let payingCount = 0;
        const inviteDates: Date[] = [];

        invitedSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.paid) {
            payingCount++;
          }
          if (userData.createdAt instanceof Timestamp) {
            inviteDates.push(userData.createdAt.toDate());
          }
        });

        setInvitedUsers(invitedCount);
        setPayingUsers(payingCount);
        setEarnings(payingCount * 60); // $60 per paying user

        // Prepare chart data
        if (inviteDates.length > 0) {
          const sortedDates = inviteDates.sort((a, b) => a.getTime() - b.getTime());
          const labels = sortedDates.map(date => date.toLocaleDateString());
          const data = sortedDates.map((_, index) => index + 1);

          setChartData({
            labels,
            datasets: [{
              label: 'Cumulative Invitations',
              data,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          });
        }

        // Fetch other dashboard data
        const response = await axios.get('/dashboard');
        setSolanaAddress(response.data.solanaAddress);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSolanaAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSolanaAddress(e.target.value);
  };

  const handleSolanaAddressSave = async () => {
    try {
      await axios.post('/update-solana-address', { solanaAddress });
      alert('Solana address updated successfully');
    } catch (error) {
      console.error('Error updating Solana address:', error);
      alert('Failed to update Solana address');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Your referral program overview</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Your invitation link</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <span className="flex-grow">{invitationLink}</span>
                <button
                  onClick={copyToClipboard}
                  className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Invited users</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                {invitedUsers}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Paying users</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                {payingUsers}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total earnings</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                ${earnings.toFixed(2)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Solana address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <input
                  type="text"
                  value={solanaAddress}
                  onChange={handleSolanaAddressChange}
                  className="flex-grow shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <button
                  onClick={handleSolanaAddressSave}
                  className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Invitations Over Time</h3>
        {chartData.labels.length > 0 ? (
          <Line options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Invitations Over Time' }
            }
          }} data={chartData} />
        ) : (
          <p className="text-gray-500">No invitation data available yet. Share your link to invite users!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
