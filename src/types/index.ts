export type Subtest = 'TWK' | 'TIU' | 'TKP';

export type PackageStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export type Difficulty = 'Mudah' | 'Sedang' | 'HOTS';

export interface OptionMap {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export interface TkpScoreMap {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface Question {
  id: string;
  number: number;
  subtest: Subtest;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: OptionMap;
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | 'E';
  tkpScores?: TkpScoreMap;
  explanation: string;
}

export interface SanitizedQuestion {
  id: string;
  number: number;
  subtest: Subtest;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: OptionMap;
}

export interface PassingGrades {
  twk: number;
  tiu: number;
  tkp: number;
}

export interface PackageVersion {
  version: string;
  versionNumber: number;
  status: PackageStatus;
  changelog?: string;
  questions: Question[];
  createdAt: string;
  publishedAt?: string;
  approvedBy?: string;
}

export interface TryoutPackage {
  id: string;
  code: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  passingGrades: PassingGrades;
  currentVersion: string;
  versions: PackageVersion[];
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
  versionAttempts?: number;
}

export interface PackageListItem {
  id: string;
  code: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  currentVersion: string;
  status: PackageStatus;
  versionCount: number;
  totalAttempts: number;
  versionAttempts: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPackageListItem {
  id: string;
  code: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  passingGrades: PassingGrades;
  currentVersion: string;
  publishedAt?: string;
  attemptCount: number;
  latestScore?: number;
  latestPassed?: boolean;
}

export interface UserAnswer {
  selectedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  isDoubtful: boolean;
}

export interface AttemptScoreBreakdown {
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  totalScore: number;
  twkCorrectCount: number;
  tiuCorrectCount: number;
  twkPassed: boolean;
  tiuPassed: boolean;
  tkpPassed: boolean;
  isPassedAll: boolean;
}

export interface UserAttempt {
  id: string;
  userId: string;
  userDisplayName: string;
  packageId: string;
  packageCode: string;
  packageTitle: string;
  packageVersion: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: Record<string, UserAnswer>;
  scores?: AttemptScoreBreakdown;
}

export interface ReviewQuestion extends Question {
  candidateAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  earnedPoints: number;
  isCorrect: boolean;
  isDoubtful: boolean;
}

export interface ReviewData {
  attempt: UserAttempt;
  package: {
    id: string;
    code: string;
    title: string;
    durationMinutes: number;
    passingGrades: PassingGrades;
  };
  questions: ReviewQuestion[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  questionId?: string;
  questionNumber?: number;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalQuestions: number;
  twkCount: number;
  tiuCount: number;
  tkpCount: number;
  issues: ValidationIssue[];
}

export interface DashboardStats {
  totalPackages: number;
  publishedPackages: number;
  draftPackages: number;
  inReviewPackages: number;
  archivedPackages: number;
  totalParticipants: number;
  totalAttempts: number;
  completedAttempts: number;
  passingRate: number;
  averageScores: {
    twk: number;
    tiu: number;
    tkp: number;
    total: number;
  };
}
