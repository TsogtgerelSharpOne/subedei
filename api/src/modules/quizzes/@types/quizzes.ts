import type { Document } from "mongoose";

export interface IQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  points?: number;
}

export interface IQuiz {
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  lectureContent?: string;
  questions: IQuestion[];
  passingScore?: number;
  timeLimitMinutes?: number;
  status?: "draft" | "active" | "archived";
  createdBy?: string;
}

export interface IQuizDocument extends IQuiz, Document<any> {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  aiFeedback?: string;
}

export interface IQuizSubmission {
  quizId: string;
  studentId: string; // Contact ID in erxes Customer
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  answers: IStudentAnswer[];
  score: number; // percentage (0 - 100)
  totalPoints?: number;
  earnedPoints?: number;
  passed: boolean;
  aiSummaryFeedback?: string;
}

export interface IQuizSubmissionDocument extends IQuizSubmission, Document<any> {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
}
