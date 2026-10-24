import { GraphQLError } from "graphql";
import { manifest } from "../config";
import type { Context } from "../connectionResolvers";
import { GemmaService } from "../services/gemma";
import { recordQuizCompletionActivity } from "../services/activityLog";
import type { IQuiz, IStudentAnswer } from "../modules/quizzes/@types/quizzes";
import { typeDefs } from "./typeDefs";

export { typeDefs };

export const resolvers = {
  Query: {
    quizStatus: (_parent: unknown, _args: unknown, { subdomain, user }: Context) => ({
      plugin: manifest.name,
      version: manifest.version,
      subdomain,
      userId: user?._id ?? null,
      userEmail: user?.email ?? null,
    }),

    quizDetail: async (_parent: unknown, { _id }: { _id: string }, { models }: Context) => {
      return models.Quizzes.getQuiz(_id);
    },

    quizzes: async (
      _parent: unknown,
      { status, page = 1, perPage = 20 }: { status?: string; page?: number; perPage?: number },
      { models }: Context,
    ) => {
      const filter: Record<string, unknown> = {};
      if (status) {
        filter.status = status;
      }
      const skip = Math.max(0, (page - 1) * perPage);
      return models.Quizzes.getQuizzes(filter, skip, perPage);
    },

    quizzesTotalCount: async (_parent: unknown, { status }: { status?: string }, { models }: Context) => {
      const filter: Record<string, unknown> = {};
      if (status) {
        filter.status = status;
      }
      return models.Quizzes.countDocuments(filter);
    },

    quizSubmissions: async (
      _parent: unknown,
      { quizId, studentId }: { quizId?: string; studentId?: string },
      { models }: Context,
    ) => {
      const filter: Record<string, unknown> = {};
      if (quizId) {
        filter.quizId = quizId;
      }
      if (studentId) {
        filter.studentId = studentId;
      }
      return models.QuizSubmissions.getSubmissions(filter);
    },

    quizSubmissionDetail: async (_parent: unknown, { _id }: { _id: string }, { models }: Context) => {
      return models.QuizSubmissions.getSubmission(_id);
    },
  },

  Mutation: {
    quizCreate: async (_parent: unknown, args: IQuiz, { models, user }: Context) => {
      return models.Quizzes.createQuiz({
        ...args,
        createdBy: user?._id || "",
      });
    },

    quizUpdate: async (
      _parent: unknown,
      { _id, ...doc }: Partial<IQuiz> & { _id: string },
      { models }: Context,
    ) => {
      return models.Quizzes.updateQuiz(_id, doc);
    },

    quizRemove: async (_parent: unknown, { _ids }: { _ids: string[] }, { models }: Context) => {
      return models.Quizzes.removeQuizzes(_ids);
    },

    quizGenerateWithGemma: async (
      _parent: unknown,
      {
        lectureContent,
        questionCount = 5,
        subject = "General",
        grade = "",
      }: {
        lectureContent: string;
        questionCount?: number;
        subject?: string;
        grade?: string;
      },
    ) => {
      if (!lectureContent || lectureContent.trim().length === 0) {
        throw new GraphQLError("Lecture material cannot be empty", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return GemmaService.generateQuiz({
        content: lectureContent,
        questionCount,
        subject,
        grade,
      });
    },

    quizSubmit: async (
      _parent: unknown,
      {
        quizId,
        studentId,
        studentName = "",
        studentEmail = "",
        studentPhone = "",
        answers,
      }: {
        quizId: string;
        studentId: string;
        studentName?: string;
        studentEmail?: string;
        studentPhone?: string;
        answers: Array<{ questionId: string; selectedOption: number }>;
      },
      { models, subdomain }: Context,
    ) => {
      const quiz = await models.Quizzes.getQuiz(quizId);
      if (!quiz) {
        throw new GraphQLError("Quiz not found", { extensions: { code: "NOT_FOUND" } });
      }

      const questionMap = new Map<string, (typeof quiz.questions)[0]>();
      for (const q of quiz.questions) {
        if (q._id) {
          questionMap.set(q._id.toString(), q);
        }
      }

      let totalPoints = 0;
      let earnedPoints = 0;
      const evaluatedAnswers: IStudentAnswer[] = [];
      const incorrectFeedbacks: string[] = [];

      for (const ans of answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        const qPoints = q.points || 1;
        totalPoints += qPoints;

        const isCorrect = ans.selectedOption === q.correctAnswerIndex;
        let aiFeedback = "";

        if (isCorrect) {
          earnedPoints += qPoints;
        } else {
          const selectedText = q.options[ans.selectedOption] || "Unknown selection";
          const correctText = q.options[q.correctAnswerIndex] || "";

          aiFeedback = await GemmaService.generateFeedback({
            question: q.question,
            selectedOptionText: selectedText,
            correctOptionText: correctText,
            lectureContext: quiz.lectureContent,
          });

          incorrectFeedbacks.push(`Q: "${q.question}" -> ${aiFeedback}`);
        }

        evaluatedAnswers.push({
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isCorrect,
          aiFeedback,
        });
      }

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passingScore = quiz.passingScore !== undefined ? quiz.passingScore : 60;
      const passed = score >= passingScore;

      const aiSummaryFeedback =
        incorrectFeedbacks.length > 0
          ? `Review needed for ${incorrectFeedbacks.length} concept(s). Focus on lecture sections indicated above.`
          : "Excellent work! Perfect mastery of the lecture material.";

      const submission = await models.QuizSubmissions.createSubmission({
        quizId,
        studentId,
        studentName,
        studentEmail,
        studentPhone,
        answers: evaluatedAnswers,
        score,
        totalPoints,
        earnedPoints,
        passed,
        aiSummaryFeedback,
      });

      await recordQuizCompletionActivity(subdomain, quiz, submission);

      return submission;
    },
  },
};
