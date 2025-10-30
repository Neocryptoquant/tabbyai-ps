import React, { useState, useRef } from 'react';
import { Participant, Role, Standing, Ballot, ScoreRecord, Institution, CheckInStatus, Room } from '../types';
import { useTournament } from '../hooks/useTournament';
import { UploadIcon, UsersIcon, ClipboardListIcon, LogoutIcon, SparklesIcon, ChartBarIcon, UserPlusIcon, CheckBadgeIcon, ArrowsUpDownIcon, ClipboardCheckIcon, TabbyAILogo } from './icons';
import BallotForm from './BallotForm';

interface AdminViewProps {
  admin: Participant;
  onLogout: () => void;
}

type AdminTab = 'participants' | 'checkin' | 'draw' | 'ballots' | 'standings';

const AdminView: React.FC<AdminViewProps> = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
                <TabbyAILogo className="w-10 h-10"/>
                <h1 className="text-xl font-bold text-slate-800">TabbyAI Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 hidden sm:block">Welcome, {admin.name}</span>
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
            <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Participants" tabName="participants" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton icon={<CheckBadgeIcon className="w-5 h-5"/>} label="Check-in" tabName="checkin" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton icon={<SparklesIcon className="w-5 h-5"/>} label="Generate Draw" tabName="draw" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton icon={<ClipboardListIcon className="w-5 h-5"/>} label="Master Ballots" tabName="ballots" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton icon={<ChartBarIcon className="w-5 h-5"/>} label="Standings" tabName="standings" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-opacity duration-300">
            {activeTab === 'participants' && <ParticipantsPanel />}
            {activeTab === 'checkin' && <CheckInPanel />}
            {activeTab === 'draw' && <DrawPanel />}
            {activeTab === 'ballots' && <MasterBallotsPanel />}
            {activeTab === 'standings' && <StandingsPanel />}
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, tabName: AdminTab, activeTab: AdminTab, setActiveTab: (tab: AdminTab) => void}> = ({icon, label, tabName, activeTab, setActiveTab}) => {
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

const PanelCard: React.FC<{title: string, description?: string, children: React.ReactNode, className?: string}> = ({ title, description, children, className }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        <div className="mt-4">
            {children}
        </div>
    </div>
);

const ParticipantsPanel: React.FC = () => {
    const { participants, institutions } = useTournament();

    const speakers = participants.filter(p => p.role === Role.Speaker);
    const judges = participants.filter(p => p.role === Role.Judge);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <ManualAddParticipantCard />
                <UploadParticipantsCard />
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <PanelCard title={`Speakers (${speakers.length})`}>
                     <ul className="space-y-2 max-h-96 overflow-y-auto">
                         {speakers.map(p => <li key={p.id} className="text-sm flex justify-between"><span>{p.name}</span> <span className="text-slate-500">{institutions.find(i=>i.id === p.institutionId)?.name}</span></li>)}
                     </ul>
                 </PanelCard>
                 <PanelCard title={`Judges (${judges.length})`}>
                     <ul className="space-y-2 max-h-96 overflow-y-auto">
                         {judges.map(p => <li key={p.id} className="text-sm flex justify-between"><span>{p.name}</span> <span className="text-slate-500">{institutions.find(i=>i.id === p.institutionId)?.name}</span></li>)}
                     </ul>
                 </PanelCard>
            </div>
        </div>
    );
};

const ManualAddParticipantCard: React.FC = () => {
    const { addParticipant } = useTournament();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>(Role.Speaker);
    const [instName, setInstName] = useState('');
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = addParticipant({ name, email, role, instName, country: '' });
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setName('');
            setEmail('');
            setInstName('');
        }
    }

    return (
        <PanelCard title="Add Participant Manually" description="Quickly add a single participant to the tournament.">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Institution</label>
                    <input type="text" value={instName} onChange={e => setInstName(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as Role)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900">
                        <option value={Role.Speaker}>Speaker</option>
                        <option value={Role.Judge}>Judge</option>
                    </select>
                </div>
                <button type="submit" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <UserPlusIcon className="w-5 h-5 mr-2"/> Add Participant
                </button>
                 {message && <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            </form>
        </PanelCard>
    );
};

const UploadParticipantsCard: React.FC = () => {
    const { loadParticipants } = useTournament();
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleUpload = () => {
        if (!file) {
            setMessage('Please select a CSV file first.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').map(row => row.trim().split(','));
            loadParticipants(rows);
            setMessage(`${rows.length - 1} participants loaded successfully!`);
            setFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    return (
         <PanelCard title="Upload Participants CSV" description="Upload a CSV with columns: Timestamp, Email, ROLE, Name, Institutional Affiliation, Country.">
            <div className="flex items-center space-x-4">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <button onClick={handleUpload} className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                <UploadIcon className="w-5 h-5 mr-2"/> Upload CSV
            </button>
            {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
        </PanelCard>
    )
};

const ParticipantCheckinCard: React.FC<{participant: Participant, status: CheckInStatus, onUpdate: (id: number, status: CheckInStatus) => void}> = ({ participant, status, onUpdate }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-800';
            case 'Absent': return 'bg-red-100 text-red-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
        }
    }
    return (
         <li className="text-sm flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
            <span>{participant.name}</span>
            <div className="flex items-center space-x-2">
                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}>{status}</span>
                 <button onClick={() => onUpdate(participant.id, 'Present')} className="px-2 py-1 text-xs text-green-700 bg-green-200 hover:bg-green-300 rounded disabled:opacity-50" disabled={status === 'Present'}>Present</button>
                 <button onClick={() => onUpdate(participant.id, 'Absent')} className="px-2 py-1 text-xs text-red-700 bg-red-200 hover:bg-red-300 rounded disabled:opacity-50" disabled={status === 'Absent'}>Absent</button>
            </div>
        </li>
    );
};

const CheckInPanel: React.FC = () => {
    const { participants, checkInStatuses, updateCheckInStatus, checkInAllPending } = useTournament();
    
    const allSpeakers = participants.filter(p => p.role === Role.Speaker);
    const allJudges = participants.filter(p => p.role === Role.Judge);

    const filterByStatus = (list: Participant[], statuses: CheckInStatus[]) => 
        list.filter(p => statuses.includes(checkInStatuses[p.id] ?? 'Pending'));

    const awaitingSpeakers = filterByStatus(allSpeakers, ['Pending', 'Absent']);
    const awaitingJudges = filterByStatus(allJudges, ['Pending', 'Absent']);
    const presentSpeakers = filterByStatus(allSpeakers, ['Present']);
    const presentJudges = filterByStatus(allJudges, ['Present']);

    const renderList = (list: Participant[]) => (
        <ul className="space-y-2">
            {list.map(p => (
                <ParticipantCheckinCard 
                    key={p.id}
                    participant={p}
                    status={checkInStatuses[p.id] ?? 'Pending'}
                    onUpdate={updateCheckInStatus}
                />
            ))}
            {list.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Empty</p>}
        </ul>
    );

    return (
        <PanelCard title="Round Check-in" description="Move participants from 'Awaiting' to 'Checked-in' to include them in the draw.">
             <div className="mb-6">
                <button 
                    onClick={checkInAllPending}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <ClipboardCheckIcon className="w-5 h-5 mr-2"/> Check-in All Pending Participants
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-slate-800 text-center">Awaiting Check-in ({awaitingSpeakers.length + awaitingJudges.length})</h4>
                    <div className="space-y-2">
                        <h5 className="font-semibold text-sm text-slate-500 uppercase px-1">Speakers ({awaitingSpeakers.length})</h5>
                        {renderList(awaitingSpeakers)}
                    </div>
                     <div className="space-y-2 pt-2">
                        <h5 className="font-semibold text-sm text-slate-500 uppercase px-1">Judges ({awaitingJudges.length})</h5>
                        {renderList(awaitingJudges)}
                    </div>
                </div>
                 <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-800 text-center">Checked-in & Ready ({presentSpeakers.length + presentJudges.length})</h4>
                     <div className="space-y-2">
                        <h5 className="font-semibold text-sm text-green-700 uppercase px-1">Speakers ({presentSpeakers.length})</h5>
                        {renderList(presentSpeakers)}
                    </div>
                     <div className="space-y-2 pt-2">
                        <h5 className="font-semibold text-sm text-green-700 uppercase px-1">Judges ({presentJudges.length})</h5>
                        {renderList(presentJudges)}
                    </div>
                </div>
            </div>
        </PanelCard>
    );
};

const DrawPanel: React.FC = () => {
    const { rounds, generateDraw, moveParticipantInDraw } = useTournament();
    const [roundName, setRoundName] = useState(`Round ${rounds.length + 1}`);
    const [speakersPerRoom, setSpeakersPerRoom] = useState(7);
    const [judgesPerRoom, setJudgesPerRoom] = useState(1);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
    const latestRound = rounds[rounds.length - 1];

    // Drag and Drop state
    type DragSource = { type: 'room'; id: number } | { type: 'unassigned' };
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [dragSource, setDragSource] = useState<DragSource | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<DragSource | null>(null);

    const handleGenerateDraw = () => {
        const result = generateDraw(roundName, speakersPerRoom, judgesPerRoom);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setRoundName(`Round ${rounds.length + 2}`);
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, participantId: number, source: DragSource) => {
        setDraggedItemId(participantId);
        setDragSource(source);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, type: 'room' | 'unassigned', id?: number) => {
        e.preventDefault();
        setDragOverTarget(type === 'room' ? { type, id: id! } : { type });
    };

    const handleDrop = (e: React.DragEvent, destination: DragSource) => {
        e.preventDefault();
        if (draggedItemId === null || dragSource === null) return;
        
        // Prevent dropping on the same source
        // FIX: The original logic was not type-safe. `destination.id` is not guaranteed to exist.
        // The new logic is explicit about the types for both dragSource and destination, which satisfies the TypeScript compiler.
        const isSameSource = (dragSource.type === 'unassigned' && destination.type === 'unassigned') ||
            (dragSource.type === 'room' && destination.type === 'room' && dragSource.id === destination.id);

        if (!isSameSource) {
            moveParticipantInDraw(draggedItemId, dragSource, destination);
        }
        
        setDraggedItemId(null);
        setDragSource(null);
        setDragOverTarget(null);
    };

    const DraggableParticipant: React.FC<{ participant: Participant, source: DragSource }> = ({ participant, source }) => (
        <li
            draggable
            onDragStart={(e) => handleDragStart(e, participant.id, source)}
            onDragEnd={() => { setDraggedItemId(null); setDragSource(null); }}
            className="flex items-center justify-between p-2 my-1 bg-white rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
        >
            <span className="text-sm">{participant.name}</span>
            <ArrowsUpDownIcon className="w-4 h-4 text-slate-400" />
        </li>
    );

    const DropZone: React.FC<{ children: React.ReactNode, onDropHandler: (e: React.DragEvent) => void, onDragOverHandler: (e: React.DragEvent) => void, isOver: boolean, className?: string }> = ({ children, onDropHandler, onDragOverHandler, isOver, className }) => (
        <div onDrop={onDropHandler} onDragOver={onDragOverHandler} className={`border border-dashed rounded-lg p-4 transition-colors h-full ${isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'} ${className}`}>
            {children}
        </div>
    );
    
    return (
        <div className="space-y-6">
            <PanelCard title="Generate New Draw" description="Configure and generate draw based on checked-in participants. After Round 1, draws are power-paired.">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700">Round Name</label>
                        <input type="text" value={roundName} onChange={e => setRoundName(e.target.value)} className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm sm:text-lg p-3 bg-white text-slate-900"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Speakers/Room</label>
                        <input type="number" min="1" value={speakersPerRoom} onChange={e => setSpeakersPerRoom(parseInt(e.target.value))} className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm sm:text-lg p-3 bg-white text-slate-900"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Judges/Room</label>
                        <input type="number" min="1" value={judgesPerRoom} onChange={e => setJudgesPerRoom(parseInt(e.target.value))} className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm sm:text-lg p-3 bg-white text-slate-900"/>
                    </div>
                    <button onClick={handleGenerateDraw} className="inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-transform transform hover:scale-105">
                        <SparklesIcon className="w-5 h-5 mr-2"/> Generate
                    </button>
                </div>
                 {message && <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            </PanelCard>

            {latestRound && (
                 <PanelCard title={`${latestRound.name} (Editable)`} description="Drag and drop participants to manually adjust rooms or move them to the unassigned list.">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                             <DropZone
                                onDropHandler={(e) => handleDrop(e, { type: 'unassigned' })}
                                onDragOverHandler={(e) => handleDragOver(e, 'unassigned')}
                                isOver={dragOverTarget?.type === 'unassigned'}
                            >
                                <h4 className="font-bold text-slate-700 text-center">Unassigned</h4>
                                <div className="mt-2">
                                    <h5 className="font-semibold text-xs text-slate-500 uppercase">Judges ({latestRound.unassigned.judges.length})</h5>
                                    <ul>{latestRound.unassigned.judges.map(p => <DraggableParticipant key={p.id} participant={p} source={{type: 'unassigned'}} />)}</ul>
                                </div>
                                <div className="mt-2">
                                    <h5 className="font-semibold text-xs text-slate-500 uppercase">Speakers ({latestRound.unassigned.speakers.length})</h5>
                                    <ul>{latestRound.unassigned.speakers.map(p => <DraggableParticipant key={p.id} participant={p} source={{type: 'unassigned'}} />)}</ul>
                                </div>
                            </DropZone>
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {latestRound.rooms.map(room => (
                                <DropZone 
                                    key={room.id}
                                    onDropHandler={(e) => handleDrop(e, { type: 'room', id: room.id })}
                                    onDragOverHandler={(e) => handleDragOver(e, 'room', room.id)}
                                    isOver={dragOverTarget?.type === 'room' && dragOverTarget.id === room.id}
                                >
                                    <h4 className="font-bold text-blue-700">{room.name}</h4>
                                    <div className="mt-2">
                                        <h5 className="font-semibold text-xs text-slate-500 uppercase">Judges</h5>
                                        <ul>{room.assignments.filter(a => a.role === Role.Judge).map(a => <DraggableParticipant key={a.participant.id} participant={a.participant} source={{type: 'room', id: room.id}} />)}</ul>
                                    </div>
                                    <div className="mt-2">
                                        <h5 className="font-semibold text-xs text-slate-500 uppercase">Speakers</h5>
                                        <ul>{room.assignments.filter(a => a.role === Role.Speaker).map(a => <DraggableParticipant key={a.participant.id} participant={a.participant} source={{type: 'room', id: room.id}} />)}</ul>
                                    </div>
                                </DropZone>
                            ))}
                        </div>
                    </div>
                </PanelCard>
            )}
        </div>
    );
};

const MasterBallotsPanel: React.FC = () => {
    const { ballots, rounds, submitBallot } = useTournament();
    const [selectedRoundId, setSelectedRoundId] = useState<number | null>(rounds[rounds.length - 1]?.id ?? null);
    const [editingBallot, setEditingBallot] = useState<Ballot | null>(null);

    const filteredBallots = selectedRoundId ? ballots.filter(b => b.roundId === selectedRoundId) : [];

    const handleBallotSubmitFromAdmin = (scores: ScoreRecord[]) => {
        if (editingBallot) {
            const updatedBallot = { ...editingBallot, scores };
            submitBallot(updatedBallot);
            setEditingBallot(null);
        }
    };

    return (
        <>
        <PanelCard title="Master Ballots" description="Oversee ballot submission status and manually enter scores if needed.">
            <div className="my-4">
                <label className="block text-sm font-medium text-slate-700">Select Round</label>
                <select onChange={(e) => setSelectedRoundId(Number(e.target.value))} value={selectedRoundId ?? ""} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-slate-900">
                    <option value="" disabled>Select a round</option>
                    {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judge</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Scores</th>
                             <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredBallots.map(ballot => {
                             const roomName = rounds.find(r => r.id === ballot.roundId)?.rooms.find(room => room.id === ballot.roomId)?.name;
                             return (
                                <tr key={ballot.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{roomName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{ballot.judge.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {ballot.submitted ? 
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Submitted</span> : 
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {ballot.submitted && ballot.scores.map(s => `${s.speaker.name.split(' ')[0]}: ${s.score}`).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button onClick={() => setEditingBallot(ballot)} className="text-blue-600 hover:text-blue-900 font-medium">
                                            {ballot.submitted ? 'Edit Scores' : 'Enter Scores'}
                                        </button>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
            </div>
        </PanelCard>

        {editingBallot && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
                    <div className="p-6">
                         <div className="flex justify-between items-start">
                             <h2 className="text-xl font-bold text-slate-800">Editing Ballot</h2>
                             <button onClick={() => setEditingBallot(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                         </div>
                        <p className="text-sm text-slate-500">For Judge: {editingBallot.judge.name}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-b-xl">
                        <BallotForm ballot={editingBallot} onSubmit={handleBallotSubmitFromAdmin} />
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const StandingsPanel: React.FC = () => {
    const { standings, rounds } = useTournament();

    if (standings.length === 0) {
        return (
             <PanelCard title="Live Speaker Standings">
                <div className="text-center py-10">
                    <h2 className="text-xl font-semibold text-slate-700">Standings are not yet available.</h2>
                    <p className="mt-2 text-slate-500">Scores will appear here as judges submit their ballots.</p>
                </div>
            </PanelCard>
        )
    }

    return (
        <PanelCard title="Live Speaker Standings" description="Results update automatically as ballots are submitted.">
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
        </PanelCard>
    );
};


export default AdminView;