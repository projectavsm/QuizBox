export interface StudentRegistrationInput {
  name: string;
  gradeClass: string;
  section: string;
  rollNumber: string;
}

export type AnswerMap = Record<number, string>; // { questionId: "A" }
export type ReviewSet = number[];               // Question IDs flagged for review

export interface SafeQuestion {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  // NOTE: correctOption is intentionally excluded for security
}

export interface AdminSessionData {
  isAdminAuthenticated: boolean;
}