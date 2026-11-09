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
  A: number; // 1 - 5
  B: number; // 1 - 5
  C: number; // 1 - 5
  D: number; // 1 - 5
  E: number; // 1 - 5
}

export interface Question {
  id: string;
  number: number;
  subtest: Subtest;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: OptionMap;
  // For TWK and TIU:
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | 'E';
  // For TKP:
  tkpScores?: TkpScoreMap;
  explanation: string;
}

// Sanitized Question sent to students while taking exam (NO answers, NO explanations!)
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
  twk: number; // default: 65
  tiu: number; // default: 80
  tkp: number; // default: 166
}

export interface PackageVersion {
  version: string; // e.g. "v1.0", "v1.1", "v2.0"
  versionNumber: number; // 1, 2, 3...
  status: PackageStatus;
  changelog?: string;
  questions: Question[];
  createdAt: string;
  publishedAt?: string;
  approvedBy?: string;
}

export interface TryoutPackage {
  id: string; // e.g. "pkg_skd_001"
  code: string; // e.g. "TO-SKD-001"
  title: string; // e.g. "Tryout 1 - SKD CPNS 2026 Standar Nasional"
  description: string;
  durationMinutes: number; // e.g. 100
  totalQuestions: number; // e.g. 110 (or 30 for mini)
  passingGrades: PassingGrades;
  currentVersion: string; // active published version or latest draft
  versions: PackageVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface UserAnswer {
  selectedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  isDoubtful: boolean; // ragu-ragu
  answeredAt?: string;
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
  attemptNumber: number; // 1st, 2nd, 3rd try
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number; // time spent
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: Record<string, UserAnswer>; // questionId -> answer
  scores?: AttemptScoreBreakdown;
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

export interface AiGenerationConfig {
  packageTitle: string;
  packageCode?: string;
  durationMinutes?: number;
  subtests: {
    twk: number; // question count
    tiu: number;
    tkp: number;
  };
  difficulty: 'Campuran (Standar BKN)' | 'Mudah' | 'Sedang' | 'HOTS';
  specificTopics?: string;
  geminiApiKey?: string;
}
