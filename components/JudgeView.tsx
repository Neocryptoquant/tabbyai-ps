import React, { useState, useEffect } from 'react';
import { Participant, Role, Ballot, ScoreRecord } from '../types';
import { useTournament } from '../hooks/useTournament';
import { LogoutIcon, CheckCircleIcon, TabbyAILogo } from './icons';
import BallotForm from './BallotForm';
import { CheckInStatusBanner } from './ParticipantView';

interface JudgeViewProps {
  judge: Participant;
  onLogout: () => void;
}

const JudgeView: React.FC<JudgeViewProps> = ({ judge, onLogout }) => {
  const { rounds, getBallotForJudge, submitBallot } = useTournament();
  const [activeBallot, setActiveBallot] = useState<Ballot | null>(null);
  const [currentRoundName, setCurrentRoundName] = useState<string>('');
  const [currentRoomName, setCurrentRoomName] = useState<string>('');
  
  const latestRound = rounds.slice().reverse().find(r => r.isLive);

  useEffect(() => {
    if (latestRound) {
      const ballot = getBallotForJudge(judge.id, latestRound.id);
      if (ballot) {
        setActiveBallot(ballot);
        setCurrentRoundName(latestRound.name);
        const room = latestRound.rooms.find(r => r.id === ballot.roomId);
        setCurrentRoomName(room ? room.name : '');
      } else {
        setActiveBallot(null);
      }
    } else {
      setActiveBallot(null);
    }
  }, [rounds, judge.id, getBallotForJudge, latestRound]);

  const handleBallotSubmit = (scores: ScoreRecord[]) => {
    if (activeBallot) {
      const updatedBallot = { ...activeBallot, scores };
      submitBallot(updatedBallot);
      setActiveBallot({ ...updatedBallot, submitted: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
       <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
                <TabbyAILogo className="w-10 h-10"/>
                <h1 className="text-xl font-bold text-slate-800">TabbyAI Judge Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 hidden sm:block">Welcome, {judge.name}</span>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden sm:block">Logout</span>
                </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {latestRound && <CheckInStatusBanner participant={judge} roundName={latestRound.name} />}
        
        {activeBallot ? (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mt-6">
            <div className="border-b pb-4 mb-6 border-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{currentRoundName} - {currentRoomName}</h2>
                <p className="text-slate-500">Please enter scores and ranks for each speaker.</p>
            </div>
            {activeBallot.submitted ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800">Ballot Submitted</h3>
                <p className="text-slate-600">Thank you! Your scores have been recorded.</p>
              </div>
            ) : (
              <BallotForm ballot={activeBallot} onSubmit={handleBallotSubmit} />
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg mt-6">
            <h2 className="text-2xl font-semibold text-slate-700">No Active Assignment</h2>
            <p className="mt-2 text-slate-500">Please wait for the Tab Director to publish the next round.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default JudgeView;