import { createEventHandlers } from "erxes-api-shared/core-modules";
import type { IQuizDocument, IQuizSubmissionDocument } from "../modules/quizzes/@types/quizzes";

export async function recordQuizCompletionActivity(
  subdomain: string,
  quiz: IQuizDocument,
  submission: IQuizSubmissionDocument,
): Promise<void> {
  try {
    const eventHandlers = createEventHandlers({
      subdomain,
      pluginName: "quiz",
      moduleName: "quizzes",
      collectionName: "quiz_submissions",
      getContext: () => ({ subdomain, processId: "quiz_submission", userId: submission.studentId || "" }),
    });

    const statusText = submission.passed ? "PASSED" : "FAILED";
    const description = `Student ${submission.studentName || submission.studentEmail || submission.studentId} completed quiz "${quiz.title}" with score ${submission.score}% (${statusText}).`;

    // 1. Record in Customer Profile Activity Log
    if (submission.studentId) {
      await eventHandlers.createActivityLog({
        activityType: "quiz:submission",
        target: {
          _id: submission.studentId,
          contentType: "contacts:customer",
        },
        action: {
          type: "completeQuiz",
          description,
        },
        context: {
          moduleName: "quiz",
          collectionName: "quiz_submissions",
          text: quiz.title,
          data: {
            quizId: quiz._id,
            quizTitle: quiz.title,
            score: submission.score,
            passed: submission.passed,
            earnedPoints: submission.earnedPoints,
            totalPoints: submission.totalPoints,
            submissionId: submission._id,
          },
        },
        changes: {
          score: submission.score,
          passed: submission.passed,
        },
      });
    }

    // 2. Trigger erxes Automation for notification
    eventHandlers.sendAutomationTriggerTarget({
      targets: [
        {
          _id: submission._id,
          studentId: submission.studentId,
          studentName: submission.studentName,
          studentEmail: submission.studentEmail,
          studentPhone: submission.studentPhone,
          quizTitle: quiz.title,
          quizId: quiz._id,
          score: submission.score,
          passed: submission.passed,
        },
      ],
      recordType: "new",
    });
  } catch {
    // Non-blocking
  }
}
