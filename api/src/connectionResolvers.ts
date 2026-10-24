import type { IMainContext } from "erxes-api-shared/core-types";
import { createGenerateModels } from "erxes-api-shared/utils";
import type { Connection } from "mongoose";
import {
  type ISampleModel,
  loadSampleClass,
} from "./modules/sample/db/models/Sample";
import type { ISampleDocument } from "./modules/sample/db/definitions/sample";
import {
  type IQuizzesModel,
  loadQuizzesClass,
} from "./modules/quizzes/db/models/Quizzes";
import {
  type IQuizSubmissionsModel,
  loadQuizSubmissionsClass,
} from "./modules/quizzes/db/models/Submissions";
import type { IQuizDocument, IQuizSubmissionDocument } from "./modules/quizzes/@types/quizzes";

export interface IModels {
  Samples: ISampleModel;
  Quizzes: IQuizzesModel;
  QuizSubmissions: IQuizSubmissionsModel;
}

export type Context = Omit<IMainContext, "models"> & {
  subdomain: string;
  models: IModels;
  user?: {
    _id: string;
    email?: string;
    username?: string;
  };
};

const loadClasses = (db: Connection) => {
  const models = {} as IModels;

  models.Samples = db.model<ISampleDocument, ISampleModel>(
    "quiz_samples",
    loadSampleClass(models),
  );

  models.Quizzes = db.model<IQuizDocument, IQuizzesModel>(
    "quizzes",
    loadQuizzesClass(models),
  );

  models.QuizSubmissions = db.model<IQuizSubmissionDocument, IQuizSubmissionsModel>(
    "quiz_submissions",
    loadQuizSubmissionsClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
