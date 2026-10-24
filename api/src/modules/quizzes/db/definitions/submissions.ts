import { Schema } from "mongoose";
import { mongooseStringRandomId } from "erxes-api-shared/utils";

export const studentAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    aiFeedback: { type: String, default: "" },
  },
  { _id: false },
);

export const quizSubmissionsSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    quizId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true }, // Contact ID in erxes CRM
    studentName: { type: String, default: "" },
    studentEmail: { type: String, default: "" },
    studentPhone: { type: String, default: "" },
    answers: { type: [studentAnswerSchema], default: [] },
    score: { type: Number, required: true },
    totalPoints: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    aiSummaryFeedback: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);
