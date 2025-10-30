import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Participant, Institution, Role, TournamentRound, Ballot, Standing, Room, CheckInStatus } from '../types';

interface TournamentContextType {
  participants: Participant[];
  institutions: Institution[];
  rounds: TournamentRound[];
  ballots: Ballot[];
  checkInStatuses: { [participantId: number]: CheckInStatus };
  updateCheckInStatus: (participantId: number, status: CheckInStatus) => void;
  checkInAllPending: () => void;
  loadParticipants: (csvData: string[][]) => void;
  addParticipant: (details: { name: string; email: string; role: Role; instName: string; country: string; }) => { success: boolean; message: string; };
  generateDraw: (roundName: string, speakersPerRoom: number, judgesPerRoom: number) => { success: boolean; message: string };
  moveParticipantInDraw: (participantId: number, source: { type: 'room'; id: number } | { type: 'unassigned' }, destination: { type: 'room'; id: number } | { type: 'unassigned' }) => void;
  submitBallot: (ballot: Ballot) => void;
  standings: Standing[];
  findParticipantByEmail: (email: string) => Participant | undefined;
  getBallotForJudge: (judgeId: number, roundId: number) => Ballot | undefined;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const mockAdmin: Participant = {
  id: 0,
  name: "Tab Director",
  email: "admin@tabbie.com",
  role: Role.Admin,
  institutionId: 0
};

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participants, setParticipants] = useState<Participant[]>([mockAdmin]);
  const [institutions, setInstitutions] = useState<Institution[]>([{id: 0, name: 'Admins', country: 'N/A'}]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [checkInStatuses, setCheckInStatuses] = useState<{ [participantId: number]: CheckInStatus }>({});

  const updateCheckInStatus = useCallback((participantId: number, status: CheckInStatus) => {
    setCheckInStatuses(prev => ({ ...prev, [participantId]: status }));
  }, []);

  const checkInAllPending = useCallback(() => {
    setCheckInStatuses(prev => {
        const newStatuses = { ...prev };
        Object.keys(newStatuses).forEach(participantIdStr => {
            const participantId = parseInt(participantIdStr, 10);
            if (newStatuses[participantId] === 'Pending') {
                newStatuses[participantId] = 'Present';
            }
        });
        return newStatuses;
    });
  }, []);
  
  const loadParticipants = useCallback((csvData: string[][]) => {
    const newInstitutions: Institution[] = [...institutions];
    const newParticipants: Participant[] = [mockAdmin];
    let institutionIdCounter = institutions.length;
    let participantIdCounter = 1; // Start after admin
    const newCheckIns: { [participantId: number]: CheckInStatus } = {};

    csvData.forEach((row, index) => {
      if (index === 0) return; // Skip header

      const [timestamp, email, roleStr, name, instName, country] = row;
      if (!email || !name || !roleStr || !instName) return;

      if (newParticipants.some(p => p.email.toLowerCase() === email.toLowerCase())) return; // Skip duplicates

      let institution = newInstitutions.find(i => i.name === instName);
      if (!institution) {
        institution = { id: institutionIdCounter++, name: instName, country: country || 'N/A' };
        newInstitutions.push(institution);
      }
      
      const role = roleStr === 'Judge' ? Role.Judge : Role.Speaker;
      const newParticipant = {
        id: participantIdCounter++,
        name,
        email,
        role,
        institutionId: institution.id,
      };
      newParticipants.push(newParticipant);
      newCheckIns[newParticipant.id] = 'Pending';
    });

    setInstitutions(newInstitutions);
    setParticipants(newParticipants);
    setCheckInStatuses(prev => ({ ...prev, ...newCheckIns }));
  }, [institutions]);

  const addParticipant = useCallback((details: { name: string; email: string; role: Role; instName: string; country: string }) => {
    const { name, email, role, instName, country } = details;

    if (participants.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'A participant with this email already exists.' };
    }

    let institution = institutions.find(i => i.name.toLowerCase() === instName.toLowerCase());
    const newInstitutions = [...institutions];
    let institutionIdCounter = institutions.length;

    if (!institution) {
        institution = { id: institutionIdCounter, name: instName, country: country || 'N/A' };
        newInstitutions.push(institution);
        setInstitutions(newInstitutions);
    }
    
    const newParticipant: Participant = {
        id: participants.length,
        name,
        email,
        role,
        institutionId: institution.id,
    };

    setParticipants(prev => [...prev, newParticipant]);
    updateCheckInStatus(newParticipant.id, 'Pending');

    return { success: true, message: `${name} has been added successfully.` };
  }, [participants, institutions, updateCheckInStatus]);

  const standings = useMemo<Standing[]>(() => {
    const speakers = participants.filter(p => p.role === Role.Speaker);
    const speakerStandings = speakers.map(speaker => {
      const scoresByRound: { [roundId: number]: number } = {};
      let roundsPlayed = 0;

      ballots.filter(b => b.submitted).forEach(ballot => {
        const scoreRecord = ballot.scores.find(s => s.speaker.id === speaker.id);
        if (scoreRecord) {
          const ballotsForSpeakerInRound = ballots.filter(b => b.roundId === ballot.roundId && b.scores.some(s => s.speaker.id === speaker.id) && b.submitted);
          const totalScoreInRound = ballotsForSpeakerInRound.reduce((acc, curr) => acc + (curr.scores.find(s => s.speaker.id === speaker.id)?.score || 0), 0);
          scoresByRound[ballot.roundId] = totalScoreInRound / ballotsForSpeakerInRound.length;
        }
      });
      
      let finalTotalScore = 0;
      Object.values(scoresByRound).forEach(score => finalTotalScore += score);
      
      rounds.forEach(round => {
          if (ballots.some(b => b.roundId === round.id && b.scores.some(s => s.speaker.id === speaker.id) && b.submitted)) {
              roundsPlayed++;
          }
      });

      return {
        participant: speaker,
        institution: institutions.find(i => i.id === speaker.institutionId)!,
        totalScore: finalTotalScore,
        averageScore: roundsPlayed > 0 ? finalTotalScore / roundsPlayed : 0,
        scoresByRound,
      };
    });

    speakerStandings.sort((a, b) => b.totalScore - a.totalScore);
    
    return speakerStandings.map((s, index) => ({ ...s, rank: index + 1 }));
  }, [participants, institutions, ballots, rounds]);

  const generateDraw = useCallback((roundName: string, speakersPerRoom: number, judgesPerRoom: number) => {
    if (rounds.some(r => r.name === roundName)) {
      return { success: false, message: `Round "${roundName}" already exists.` };
    }

    let availableSpeakers = participants.filter(p => p.role === Role.Speaker && checkInStatuses[p.id] === 'Present');
    let availableJudges = participants.filter(p => p.role === Role.Judge && checkInStatuses[p.id] === 'Present');

    if (availableSpeakers.length === 0) {
      return { success: false, message: "No checked-in speakers available to generate a draw." };
    }

    const numRooms = Math.floor(availableSpeakers.length / speakersPerRoom);
    if(availableJudges.length < numRooms * judgesPerRoom) {
      return { success: false, message: `Not enough checked-in judges. Need ${numRooms * judgesPerRoom}, but only have ${availableJudges.length}.`};
    }

    const isFirstRound = rounds.length === 0;

    if (!isFirstRound) {
        const speakerIdsInStandings = new Set(standings.map(s => s.participant.id));
        const rankedSpeakers = standings.map(s => s.participant).filter(p => checkInStatuses[p.id] === 'Present');
        const unrankedSpeakers = availableSpeakers.filter(p => !speakerIdsInStandings.has(p.id));
        availableSpeakers = [...rankedSpeakers, ...unrankedSpeakers.sort(() => Math.random() - 0.5)];
    } else {
        availableSpeakers.sort(() => Math.random() - 0.5);
    }
    availableJudges.sort(() => Math.random() - 0.5);

    const newRooms: Room[] = [];
    const newBallots: Ballot[] = [];
    const roundId = rounds.length + 1;

    for (let i = 0; i < numRooms; i++) {
      const roomSpeakers = availableSpeakers.splice(0, speakersPerRoom);
      const room: Room = {
        id: (roundId * 100) + i + 1,
        name: `Room ${i + 1}`,
        assignments: roomSpeakers.map(p => ({ participant: p, role: Role.Speaker, checkInStatus: 'Present' }))
      };
      
      const speakerInstitutionIds = new Set(roomSpeakers.map(s => s.institutionId));
      const assignedJudges: Participant[] = [];
      let attempts = 0;
      const potentialJudges = [...availableJudges];

      while(assignedJudges.length < judgesPerRoom && attempts < potentialJudges.length * 2) {
        const judgeIndex = Math.floor(Math.random() * potentialJudges.length);
        const potentialJudge = potentialJudges[judgeIndex];
        if (potentialJudge && !speakerInstitutionIds.has(potentialJudge.institutionId)) {
          assignedJudges.push(potentialJudge);
          potentialJudges.splice(judgeIndex, 1);
        }
        attempts++;
      }
      
      if (assignedJudges.length < judgesPerRoom) {
         const remainingNeeded = judgesPerRoom - assignedJudges.length;
         assignedJudges.push(...potentialJudges.splice(0, remainingNeeded));
      }
      
      availableJudges = availableJudges.filter(j => !assignedJudges.some(aj => aj.id === j.id));

      assignedJudges.forEach(judge => {
        room.assignments.push({ participant: judge, role: Role.Judge, checkInStatus: 'Present' });
        newBallots.push({
            id: ballots.length + newBallots.length + 1,
            roundId: roundId,
            roomId: room.id,
            judge: judge,
            scores: roomSpeakers.map(s => ({ speaker: s, score: 0, rank: 0 })),
            submitted: false,
        });
      });
      newRooms.push(room);
    }
    
    const newRound: TournamentRound = {
      id: roundId,
      name: roundName,
      isLive: true,
// FIX: Added missing isSilent property
      isSilent: false,
      rooms: newRooms,
      unassigned: {
        speakers: availableSpeakers,
        judges: availableJudges
      }
    };

    setRounds(prev => {
        const updatedRounds = prev.map(r => ({...r, isLive: false}));
        return [...updatedRounds, newRound];
    });
    setBallots(prev => [...prev, ...newBallots]);
    
    // Reset check-ins for the next round
    const nextCheckins: { [id: number]: CheckInStatus } = {};
    participants.filter(p => p.role !== Role.Admin).forEach(p => nextCheckins[p.id] = 'Pending');
    setCheckInStatuses(nextCheckins);


    return { success: true, message: `Successfully generated draw for ${roundName}.` };
  }, [participants, rounds, ballots.length, standings, checkInStatuses]);

  const moveParticipantInDraw = useCallback((participantId: number, source: { type: 'room'; id: number } | { type: 'unassigned' }, destination: { type: 'room'; id: number } | { type: 'unassigned' }) => {
    setRounds(prevRounds => {
        const newRounds = [...prevRounds];
        const latestRoundIndex = newRounds.length - 1;
        if (latestRoundIndex < 0) return prevRounds;

        let latestRound = { ...newRounds[latestRoundIndex] };

        let participantToMove: Participant | undefined;
        let participantRole: Role.Speaker | Role.Judge | undefined;

        // --- IMMUTABLY REMOVE FROM SOURCE ---
        if (source.type === 'room') {
            latestRound.rooms = latestRound.rooms.map(room => {
                if (room.id === source.id) {
                    const assignment = room.assignments.find(a => a.participant.id === participantId);
                    if (assignment) {
                        participantToMove = assignment.participant;
                        participantRole = assignment.role;
                        return { ...room, assignments: room.assignments.filter(a => a.participant.id !== participantId) };
                    }
                }
                return room;
            });
        } else { // source is 'unassigned'
            const foundInSpeakers = latestRound.unassigned.speakers.find(p => p.id === participantId);
            if (foundInSpeakers) {
                participantToMove = foundInSpeakers;
                participantRole = Role.Speaker;
                latestRound = { ...latestRound, unassigned: { ...latestRound.unassigned, speakers: latestRound.unassigned.speakers.filter(p => p.id !== participantId) } };
            } else {
                const foundInJudges = latestRound.unassigned.judges.find(p => p.id === participantId);
                if (foundInJudges) {
                    participantToMove = foundInJudges;
                    participantRole = Role.Judge;
                    latestRound = { ...latestRound, unassigned: { ...latestRound.unassigned, judges: latestRound.unassigned.judges.filter(p => p.id !== participantId) } };
                }
            }
        }

        if (!participantToMove || !participantRole) {
            return prevRounds; // Participant not found, abort state update
        }

        // --- IMMUTABLY ADD TO DESTINATION ---
        if (destination.type === 'room') {
            latestRound.rooms = latestRound.rooms.map(room => {
                if (room.id === destination.id) {
                    return { ...room, assignments: [...room.assignments, { participant: participantToMove!, role: participantRole!, checkInStatus: 'Present' }] };
                }
                return room;
            });
        } else { // destination is 'unassigned'
            if (participantRole === Role.Speaker) {
                latestRound = { ...latestRound, unassigned: { ...latestRound.unassigned, speakers: [...latestRound.unassigned.speakers, participantToMove] } };
            } else { // Role.Judge
                latestRound = { ...latestRound, unassigned: { ...latestRound.unassigned, judges: [...latestRound.unassigned.judges, participantToMove] } };
            }
        }

        newRounds[latestRoundIndex] = latestRound;
        return newRounds;
    });
  }, []);

  const submitBallot = useCallback((updatedBallot: Ballot) => {
    setBallots(prev => prev.map(b => b.id === updatedBallot.id ? { ...updatedBallot, submitted: true } : b));
  }, []);

  const findParticipantByEmail = useCallback((email: string) => {
    return participants.find(p => p.email.toLowerCase() === email.toLowerCase());
  }, [participants]);

  const getBallotForJudge = useCallback((judgeId: number, roundId: number) => {
    return ballots.find(b => b.judge.id === judgeId && b.roundId === roundId);
  }, [ballots]);

  const contextValue = {
    participants,
    institutions,
    rounds,
    ballots,
    checkInStatuses,
    updateCheckInStatus,
    checkInAllPending,
    loadParticipants,
    addParticipant,
    generateDraw,
    moveParticipantInDraw,
    submitBallot,
    standings,
    findParticipantByEmail,
    getBallotForJudge,
  };

  return React.createElement(TournamentContext.Provider, { value: contextValue }, children);
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
