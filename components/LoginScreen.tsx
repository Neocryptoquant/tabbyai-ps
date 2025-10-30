import React, { useState } from 'react';
import { useTournament } from '../hooks/useTournament';
import { Participant } from '../types';
import { TabbyAILogo } from './icons';

interface LoginScreenProps {
  onLogin: (user: Participant) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { findParticipantByEmail } = useTournament();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    const user = findParticipantByEmail(email);
    if (user) {
      onLogin(user);
    } else {
      setError('No participant found with this email. Please contact the Tab Director.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            <TabbyAILogo className="w-28 h-28" />
        </div>
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
                Welcome to TabbyAI
            </h1>
            <p className="mt-2 text-slate-500">
                The smart tournament manager.
            </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email-address" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition bg-white text-slate-900"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
                <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                >
                Sign In
                </button>
            </div>
            </form>
        </div>
        <div className="text-center text-xs text-slate-500 mt-6">
            <p>Don't have an account? Your Tab Director will add you.</p>
            <p className="mt-1">Default Admin Login: <strong>admin@tabbie.com</strong></p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;