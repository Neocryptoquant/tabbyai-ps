import React, { useState } from 'react';
import { Participant, Role, Standing } from '../types';
import { useTournament } from '../hooks/useTournament';
import { LogoutIcon, ChartBarIcon, ClipboardListIcon, CheckBadgeIcon, TabbyAILogo } from './icons';

interface ParticipantViewProps {
  participant: Participant;
  onLogout: () => void;
}

type ParticipantTab = 'draw' | 'standings';

export const CheckInStatusBanner: React.FC<{ participant: Participant, roundName: string }> = ({ participant, roundName }) => {
    const { checkInStatuses, updateCheckInStatus } = useTournament();
    const status = checkInStatuses[participant.id] ?? 'Pending';

    if (status === 'Absent') {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                <p className="font-bold">You are marked as ABSENT for {roundName}.</p>
                <p>If this is a mistake, please contact the Tab Director immediately.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-slate-800">Ready for {roundName}?</h3>
                <p className="text-sm text-slate-600">Please confirm your availability for the current round.</p>
            </div>
            {status === 'Pending' ? (
                 <button 
                    onClick={() => updateCheckInStatus(participant.id, 'Present')}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                 >
                    Check In
                 </button>
            ) : (
                <div className="flex items-center space-x-2 text-green-600 font-semibold">
                    <CheckBadgeIcon className="w-6 h-6"/>
                    <span>Checked In!</span>
                </div>
            )}
        </div>
    )
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ participant, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ParticipantTab>('draw');
  const { rounds } = useTournament();
  const latestRound = rounds.slice().reverse().find(r => r.isLive);


  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
                <TabbyAILogo className="w-10 h-10"/>
                <h1 className="text-xl font-bold text-slate-800">TabbyAI Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 hidden sm:block">Welcome, {participant.name}</span>
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
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-slate-200 space-x-4">
            <TabButton icon={<ClipboardListIcon className="w-5 h-5"/>} label="Current Draw" tabName="draw" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton icon={<ChartBarIcon className="w-5 h-5"/>} label="Live Standings" tabName="standings" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {latestRound && <CheckInStatusBanner participant={participant} roundName={latestRound.name} />}

        {activeTab === 'draw' && <DrawDisplay currentParticipantId={participant.id} />}
        {activeTab === 'standings' && <StandingsDisplay />}
      </main>
    </div>
  );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, tabName: ParticipantTab, activeTab: ParticipantTab, setActiveTab: (tab: ParticipantTab) => void}> = ({icon, label, tabName, activeTab, setActiveTab}) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center space-x-2 px-3 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors focus:outline-none ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
            {icon} <span>{label}</span>
        </button>
    )
}

const DrawDisplay: React.FC<{currentParticipantId: number}> = ({ currentParticipantId }) => {
    const { rounds } = useTournament();
    const latestRound = rounds.slice().reverse().find(r => r.isLive);

    if (!latestRound) {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-slate-700">The first round has not started yet.</h2>
                <p className="mt-2 text-slate-500">Please check back soon!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">{latestRound.name} Draw</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestRound.rooms.map(room => {
                        const isParticipantInRoom = room.assignments.some(a => a.participant.id === currentParticipantId);
                        return (
                            <div key={room.id} className={`border rounded-lg p-4 transition-all ${isParticipantInRoom ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-slate-200 bg-white'}`}>
                                <h4 className="font-bold text-lg text-blue-700">{room.name}</h4>
                                <div className="mt-3">
                                    <h5 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Judges</h5>
                                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                                        {room.assignments.filter(a => a.role === Role.Judge).map(a => <li key={a.participant.id}>{a.participant.name}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-4">
                                    <h5 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Speakers</h5>
                                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                                        {room.assignments.filter(a => a.role === Role.Speaker).map(a => <li key={a.participant.id} className={a.participant.id === currentParticipantId ? 'font-bold text-blue-800' : ''}>{a.participant.name}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const StandingsDisplay: React.FC = () => {
    const { standings, rounds } = useTournament();

    if (standings.length === 0) {
        return (
             <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-slate-700">Standings are not yet available.</h2>
                <p className="mt-2 text-slate-500">Scores will appear here as judges submit their ballots.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
             <div className="p-6">
                <h3 className="text-2xl font-semibold text-slate-900">Live Speaker Standings</h3>
                <p className="text-sm text-slate-500 mt-1">Results update automatically as ballots are submitted.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Institution</th>
                            {rounds.map(r => <th key={r.id} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{r.name.replace('Round ','R')}</th>)}
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {standings.map((s: Standing) => (
                            <tr key={s.participant.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-800">{s.rank}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.participant.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.institution.name}</td>
                                 {rounds.map(r => <td key={r.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">{s.scoresByRound[r.id] ? Math.round(s.scoresByRound[r.id] * 10)/10 : '-'}</td>)}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600">{Math.round(s.totalScore * 10)/10}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ParticipantView;