import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers";
import { quizzesSchema } from "../definitions/quizzes";
import type { IQuiz, IQuizDocument } from "../../@types/quizzes";

export interface IQuizzesModel extends Model<IQuizDocument> {
  getQuiz(_id: string): Promise<IQuizDocument>;
  getQuizzes(filter?: Record<string, unknown>, skip?: number, limit?: number): Promise<IQuizDocument[]>;
  createQuiz(doc: IQuiz): Promise<IQuizDocument>;
  updateQuiz(_id: string, doc: Partial<IQuiz>): Promise<IQuizDocument>;
  removeQuizzes(quizIds: string[]): Promise<{ acknowledged: boolean; deletedCount: number }>;
}

export const loadQuizzesClass = (models: IModels) => {
  class Quiz {
    public static async getQuiz(_id: string) {
      const quiz = await models.Quizzes.findOne({ _id }).lean();
      if (!quiz) {
        throw new Error("Quiz not found");
      }
      return quiz as unknown as IQuizDocument;
    }

    public static async getQuizzes(
      filter: Record<string, unknown> = {},
      skip = 0,
      limit = 20,
    ): Promise<IQuizDocument[]> {
      return models.Quizzes.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as IQuizDocument[];
    }

    public static async createQuiz(doc: IQuiz): Promise<IQuizDocument> {
      return models.Quizzes.create(doc);
    }

    public static async updateQuiz(_id: string, doc: Partial<IQuiz>) {
      const updated = await models.Quizzes.findOneAndUpdate(
        { _id },
        { $set: { ...doc } },
        { new: true },
      ).lean();

      if (!updated) {
        throw new Error("Quiz not found");
      }
      return updated as unknown as IQuizDocument;
    }

    public static async removeQuizzes(quizIds: string[]) {
      return models.Quizzes.deleteMany({ _id: { $in: quizIds } });
    }
  }

  quizzesSchema.loadClass(Quiz);
  return quizzesSchema;
};
