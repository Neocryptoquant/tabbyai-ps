
import React, { useState } from 'react';
import { TournamentProvider } from './hooks/useTournament';
import { Participant, Role } from './types';
import LoginScreen from './components/LoginScreen';
import AdminView from './components/AdminView';
import JudgeView from './components/JudgeView';
import ParticipantView from './components/ParticipantView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);

  const handleLogin = (user: Participant) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    switch (currentUser.role) {
      case Role.Admin:
        return <AdminView admin={currentUser} onLogout={handleLogout} />;
      case Role.Judge:
        return <JudgeView judge={currentUser} onLogout={handleLogout} />;
      case Role.Speaker:
        return <ParticipantView participant={currentUser} onLogout={handleLogout} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <TournamentProvider>
      <div className="min-h-screen bg-slate-100">
        {renderContent()}
      </div>
    </TournamentProvider>
  );
};

export default App;