import { gql } from "graphql-tag";

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.9", import: ["@key"])

  scalar JSON

  type QuizStatus {
    plugin: String!
    version: String!
    subdomain: String!
    userId: String
    userEmail: String
  }

  type QuizQuestion {
    _id: String
    question: String!
    options: [String!]!
    correctAnswerIndex: Int!
    explanation: String
    points: Int
  }

  type Quiz {
    _id: String!
    title: String!
    description: String
    subject: String
    grade: String
    lectureContent: String
    questions: [QuizQuestion]
    passingScore: Int
    timeLimitMinutes: Int
    status: String
    createdBy: String
    createdAt: String
    updatedAt: String
  }

  type StudentAnswer {
    questionId: String!
    selectedOption: Int!
    isCorrect: Boolean!
    aiFeedback: String
  }

  type QuizSubmission {
    _id: String!
    quizId: String!
    studentId: String!
    studentName: String
    studentEmail: String
    studentPhone: String
    answers: [StudentAnswer]
    score: Float!
    totalPoints: Int
    earnedPoints: Int
    passed: Boolean!
    aiSummaryFeedback: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    quizStatus: QuizStatus!
    quizDetail(_id: String!): Quiz
    quizzes(status: String, page: Int, perPage: Int): [Quiz]
    quizzesTotalCount(status: String): Int
    quizSubmissions(quizId: String, studentId: String): [QuizSubmission]
    quizSubmissionDetail(_id: String!): QuizSubmission
  }

  type Mutation {
    quizCreate(
      title: String!
      description: String
      subject: String
      grade: String
      lectureContent: String
      questions: [JSON]
      passingScore: Int
      timeLimitMinutes: Int
    ): Quiz

    quizUpdate(
      _id: String!
      title: String
      description: String
      subject: String
      grade: String
      lectureContent: String
      questions: [JSON]
      passingScore: Int
      timeLimitMinutes: Int
      status: String
    ): Quiz

    quizRemove(_ids: [String!]!): JSON

    quizGenerateWithGemma(
      lectureContent: String!
      questionCount: Int
      subject: String
      grade: String
    ): JSON

    quizSubmit(
      quizId: String!
      studentId: String!
      studentName: String
      studentEmail: String
      studentPhone: String
      answers: [JSON]!
    ): QuizSubmission
  }
`;
