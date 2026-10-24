import { Schema } from "mongoose";
import { mongooseStringRandomId } from "erxes-api-shared/utils";

export const questionSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
    points: { type: Number, default: 1 },
  },
  { _id: false },
);

export const quizzesSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    title: { type: String, required: true, label: "Title" },
    description: { type: String, default: "", label: "Description" },
    subject: { type: String, default: "General", label: "Subject" },
    grade: { type: String, default: "", label: "Grade" },
    lectureContent: { type: String, default: "", label: "Lecture Content" },
    questions: { type: [questionSchema], default: [] },
    passingScore: { type: Number, default: 60, label: "Passing Score (%)" },
    timeLimitMinutes: { type: Number, default: 15, label: "Time Limit (Minutes)" },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      label: "Status",
    },
    createdBy: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);
