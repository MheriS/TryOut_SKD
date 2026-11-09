import {
  Question,
  SanitizedQuestion,
  UserAnswer,
  AttemptScoreBreakdown,
  PassingGrades,
  ValidationReport,
  ValidationIssue
} from '../types.js';

/**
 * Sanitizes questions before sending to exam candidate.
 * CRITICAL SECURITY (Req 9):
 * Strips correctAnswer, tkpScores, and explanation so students CANNOT inspect answers.
 */
export function sanitizeQuestionsForExam(questions: Question[]): SanitizedQuestion[] {
  return questions.map(q => ({
    id: q.id,
    number: q.number,
    subtest: q.subtest,
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options
  }));
}

/**
 * Server-side evaluation of student attempt (Req 5, 6 & 9)
 */
export function evaluateAttempt(
  questions: Question[],
  userAnswers: Record<string, UserAnswer>,
  passingGrades: PassingGrades = { twk: 65, tiu: 80, tkp: 166 }
): AttemptScoreBreakdown {
  let twkScore = 0;
  let tiuScore = 0;
  let tkpScore = 0;
  let twkCorrectCount = 0;
  let tiuCorrectCount = 0;

  for (const q of questions) {
    const ans = userAnswers[q.id]?.selectedOption;

    if (q.subtest === 'TWK') {
      if (ans && ans === q.correctAnswer) {
        twkScore += 5;
        twkCorrectCount++;
      }
    } else if (q.subtest === 'TIU') {
      if (ans && ans === q.correctAnswer) {
        tiuScore += 5;
        tiuCorrectCount++;
      }
    } else if (q.subtest === 'TKP') {
      if (ans && q.tkpScores && q.tkpScores[ans] !== undefined) {
        tkpScore += q.tkpScores[ans];
      }
    }
  }

  const totalScore = twkScore + tiuScore + tkpScore;
  const twkPassed = twkScore >= passingGrades.twk;
  const tiuPassed = tiuScore >= passingGrades.tiu;
  const tkpPassed = tkpScore >= passingGrades.tkp;
  const isPassedAll = twkPassed && tiuPassed && tkpPassed;

  return {
    twkScore,
    tiuScore,
    tkpScore,
    totalScore,
    twkCorrectCount,
    tiuCorrectCount,
    twkPassed,
    tiuPassed,
    tkpPassed,
    isPassedAll
  };
}

/**
 * Validates question package before admin approves/publishes it (Req 3, 10)
 */
export function validatePackageQuestions(questions: Question[]): ValidationReport {
  const issues: ValidationIssue[] = [];
  let twkCount = 0;
  let tiuCount = 0;
  let tkpCount = 0;

  if (!questions || questions.length === 0) {
    issues.push({
      type: 'error',
      message: 'Paket belum memiliki soal sama sekali.'
    });
    return {
      isValid: false,
      totalQuestions: 0,
      twkCount: 0,
      tiuCount: 0,
      tkpCount: 0,
      issues
    };
  }

  const seenIds = new Set<string>();

  questions.forEach((q, idx) => {
    const qNum = q.number || idx + 1;

    // Check duplicate ID
    if (seenIds.has(q.id)) {
      issues.push({
        type: 'error',
        questionId: q.id,
        questionNumber: qNum,
        message: `ID soal "${q.id}" terduplikasi pada butir ${qNum}.`
      });
    }
    seenIds.add(q.id);

    // Count subtests
    if (q.subtest === 'TWK') twkCount++;
    else if (q.subtest === 'TIU') tiuCount++;
    else if (q.subtest === 'TKP') tkpCount++;
    else {
      issues.push({
        type: 'error',
        questionId: q.id,
        questionNumber: qNum,
        message: `Subtes "${q.subtest}" tidak valid (harus TWK, TIU, atau TKP).`
      });
    }

    // Check Question Text
    if (!q.question || q.question.trim().length < 5) {
      issues.push({
        type: 'error',
        questionId: q.id,
        questionNumber: qNum,
        message: `Pertanyaan butir ${qNum} terlalu pendek atau kosong.`
      });
    }

    // Check Options A - E
    const validKeys: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];
    if (!q.options) {
      issues.push({
        type: 'error',
        questionId: q.id,
        questionNumber: qNum,
        message: `Pilihan jawaban butir ${qNum} tidak lengkap.`
      });
    } else {
      for (const opt of validKeys) {
        if (!q.options[opt] || q.options[opt].trim() === '') {
          issues.push({
            type: 'error',
            questionId: q.id,
            questionNumber: qNum,
            message: `Pilihan (${opt}) butir ${qNum} masih kosong.`
          });
        }
      }
    }

    // Check Answer Keys
    if (q.subtest === 'TWK' || q.subtest === 'TIU') {
      if (!q.correctAnswer || !validKeys.includes(q.correctAnswer)) {
        issues.push({
          type: 'error',
          questionId: q.id,
          questionNumber: qNum,
          message: `Kunci jawaban butir ${qNum} (${q.subtest}) wajib ditentukan (A, B, C, D, atau E).`
        });
      }
    } else if (q.subtest === 'TKP') {
      if (!q.tkpScores) {
        issues.push({
          type: 'error',
          questionId: q.id,
          questionNumber: qNum,
          message: `Bobot nilai TKP (1 s.d. 5) butir ${qNum} belum ditentukan.`
        });
      } else {
        const scores = validKeys.map(k => q.tkpScores![k]);
        const hasInvalidScore = scores.some(s => typeof s !== 'number' || s < 1 || s > 5);
        if (hasInvalidScore) {
          issues.push({
            type: 'error',
            questionId: q.id,
            questionNumber: qNum,
            message: `Bobot nilai TKP butir ${qNum} harus berupa angka 1 sampai 5.`
          });
        }
      }
    }

    // Check Explanation
    if (!q.explanation || q.explanation.trim().length < 10) {
      issues.push({
        type: 'warning',
        questionId: q.id,
        questionNumber: qNum,
        message: `Pembahasan butir ${qNum} disarankan lebih rinci untuk edukasi peserta.`
      });
    }
  });

  const hasErrors = issues.some(i => i.type === 'error');

  return {
    isValid: !hasErrors,
    totalQuestions: questions.length,
    twkCount,
    tiuCount,
    tkpCount,
    issues
  };
}
