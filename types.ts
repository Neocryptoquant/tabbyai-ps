
export enum Role {
  Admin = 'Admin',
  Judge = 'Judge',
  Speaker = 'Speaker',
}

export interface Institution {
  id: number;
  name: string;
  country: string;
}

export interface Participant {
  id: number;
  name: string;
  email: string;
  role: Role;
  institutionId: number;
}

export type CheckInStatus = 'Present' | 'Absent' | 'Pending';

export interface TournamentRound {
  id: number;
  name: string;
  isLive: boolean;
  isSilent: boolean;
  rooms: Room[];
  unassigned: {
    speakers: Participant[];
    judges: Participant[];
  };
}

export interface Room {
  id: number;
  name: string;
  assignments: RoomAssignment[];
}

export interface RoomAssignment {
  participant: Participant;
  role: Role.Speaker | Role.Judge;
  checkInStatus: CheckInStatus;
}

export interface Ballot {
  id: number;
  roomId: number;
  roundId: number;
  judge: Participant;
  scores: ScoreRecord[];
  submitted: boolean;
}

export interface ScoreRecord {
  speaker: Participant;
  score: number;
  rank: number;
}

export interface Standing {
  rank: number;
  participant: Participant;
  institution: Institution;
  totalScore: number;
  averageScore: number;
  scoresByRound: { [roundId: number]: number };
}