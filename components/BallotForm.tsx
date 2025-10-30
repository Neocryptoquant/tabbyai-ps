import React, { useState } from 'react';
import { Ballot, ScoreRecord } from '../types';
import { ExclamationCircleIcon } from './icons';

interface BallotFormProps {
    ballot: Ballot;
    onSubmit: (scores: ScoreRecord[]) => void;
}

const getRankColor = (rank: number): string => {
    if (rank === 0) return 'bg-white border-slate-300 text-slate-900';
    switch (rank) {
        case 1:
            return 'bg-yellow-100 border-yellow-400 text-yellow-800 font-bold'; // Gold
        case 2:
            return 'bg-slate-200 border-slate-400 text-slate-800 font-semibold'; // Silver
        case 3:
            return 'bg-orange-200 border-orange-400 text-orange-800 font-semibold'; // Bronze
        default:
            return 'bg-white border-slate-300 text-slate-900';
    }
};


const BallotForm: React.FC<BallotFormProps> = ({ ballot, onSubmit }) => {
    const [scores, setScores] = useState<ScoreRecord[]>(ballot.scores);
    const [error, setError] = useState<string>('');

    const handleScoreChange = (speakerId: number, value: string) => {
        const newScores = scores.map(s => 
            s.speaker.id === speakerId ? { ...s, score: value === '' ? 0 : parseFloat(value) } : s
        );
        setScores(newScores);
    };

    const handleRankChange = (speakerId: number, value: string) => {
        const newScores = scores.map(s => 
            s.speaker.id === speakerId ? { ...s, rank: parseInt(value) || 0 } : s
        );
        setScores(newScores);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation for score range and rank presence
        if (scores.some(s => s.score <= 0 || s.score > 100)) {
            setError('Scores must be between 1 and 100.');
            return;
        }
        if (scores.some(s => s.rank <= 0)) {
            setError('All speakers must be given a rank.');
            return;
        }

        // Advanced validation: ensure ranks correspond to scores
        // Create a sorted list of unique scores in descending order to determine ranks
        // FIX: Explicitly cast values to Number to prevent TypeScript errors with arithmetic operations in the sort function.
        const sortedUniqueScores = [...new Set(scores.map(s => s.score))].sort((a, b) => Number(b) - Number(a));
        
        // Check if user-entered ranks match the ranks derived from scores
        for (const record of scores) {
            // The correct rank is the position (1-indexed) of the score in the sorted unique list
            const expectedRank = sortedUniqueScores.indexOf(record.score) + 1;
            if (record.rank !== expectedRank) {
                setError(`Rank for ${record.speaker.name} is incorrect. Based on the scores, it should be rank ${expectedRank}. Please correct the ranks.`);
                return;
            }
        }

        onSubmit(scores);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="py-3 pr-4 text-left text-sm font-semibold text-slate-600">Speaker</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600 w-32">Score (/100)</th>
                            <th className="py-3 pl-4 text-left text-sm font-semibold text-slate-600 w-28">Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores.map((record) => (
                            <tr key={record.speaker.id} className="border-b border-slate-200">
                                <td className="py-4 pr-4 font-medium text-slate-800">{record.speaker.name}</td>
                                <td className="py-3 px-4">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        step="0.1"
                                        value={record.score || ''} 
                                        onChange={e => handleScoreChange(record.speaker.id, e.target.value)} 
                                        className="w-full rounded-md border-slate-300 shadow-sm text-center bg-white text-slate-900"
                                    />
                                </td>
                                <td className="py-3 pl-4">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={scores.length} 
                                        value={record.rank || ''} 
                                        onChange={e => handleRankChange(record.speaker.id, e.target.value)} 
                                        className={`w-full rounded-md shadow-sm text-center transition-colors border ${getRankColor(record.rank)}`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && (
                <div className="flex items-center p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    <ExclamationCircleIcon className="w-5 h-5 mr-3"/>
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                    Submit Ballot
                </button>
            </div>
        </form>
    )
}

export default BallotForm;