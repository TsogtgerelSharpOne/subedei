import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers";
import { quizSubmissionsSchema } from "../definitions/submissions";
import type { IQuizSubmission, IQuizSubmissionDocument } from "../../@types/quizzes";

export interface IQuizSubmissionsModel extends Model<IQuizSubmissionDocument> {
  getSubmission(_id: string): Promise<IQuizSubmissionDocument>;
  getSubmissions(filter?: Record<string, unknown>, skip?: number, limit?: number): Promise<IQuizSubmissionDocument[]>;
  createSubmission(doc: IQuizSubmission): Promise<IQuizSubmissionDocument>;
  getStudentSubmissions(studentId: string): Promise<IQuizSubmissionDocument[]>;
}

export const loadQuizSubmissionsClass = (models: IModels) => {
  class QuizSubmission {
    public static async getSubmission(_id: string) {
      const submission = await models.QuizSubmissions.findOne({ _id }).lean();
      if (!submission) {
        throw new Error("Submission not found");
      }
      return submission as unknown as IQuizSubmissionDocument;
    }

    public static async getSubmissions(
      filter: Record<string, unknown> = {},
      skip = 0,
      limit = 50,
    ): Promise<IQuizSubmissionDocument[]> {
      return models.QuizSubmissions.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as IQuizSubmissionDocument[];
    }

    public static async createSubmission(doc: IQuizSubmission): Promise<IQuizSubmissionDocument> {
      return models.QuizSubmissions.create(doc);
    }

    public static async getStudentSubmissions(studentId: string): Promise<IQuizSubmissionDocument[]> {
      return models.QuizSubmissions.find({ studentId }).sort({ createdAt: -1 }).lean() as unknown as IQuizSubmissionDocument[];
    }
  }

  quizSubmissionsSchema.loadClass(QuizSubmission);
  return quizSubmissionsSchema;
};
