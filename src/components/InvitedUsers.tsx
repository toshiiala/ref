import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface User {
  id: string;
  firstName: string;
  paid: boolean;
  createdAt: Date;
}

const InvitedUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const invitedQuery = query(usersRef, where('invitedBy', '==', 'degencalls'));
        const invitedSnapshot = await getDocs(invitedQuery);
        
        const invitedUsers = invitedSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName || 'Anonymous',
            paid: data.paid || false,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
          };
        });

        setUsers(invitedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invited users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Invited Users</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">A list of all users you have invited</p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {users.map(user => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">{user.firstName}</p>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.paid ? 'Paid' : 'Not Paid'}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    Invited on: {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InvitedUsers;
