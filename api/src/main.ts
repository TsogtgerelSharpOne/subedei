import { startPlugin } from "erxes-api-shared/utils";
import { manifest } from "./config";
import { generateModels } from "./connectionResolvers";
import { resolvers, typeDefs } from "./graphql/schema";
import { permissions } from "./permissions";
import { GemmaService } from "./services/gemma";

startPlugin({
  name: manifest.name,
  port: manifest.api.port,
  meta: { permissions },
  graphql: async () => ({ typeDefs, resolvers }),
  apolloServerContext: async (subdomain, context) => {
    context.models = await generateModels(subdomain, context);
    return context;
  },
  apiHandlers: [
    {
      method: "GET",
      path: "/health",
      resolver: (_req, res) => {
        res.status(200).json({
          status: "ok",
          service: "erxes-smart-quiz",
          plugin: manifest.name,
          version: manifest.version,
          gemmaIntegration: "active",
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      method: "POST",
      path: "/api/generate",
      resolver: async (req, res) => {
        try {
          const { content, questionCount, subject, grade } = req.body || {};
          if (!content) {
            res.status(400).json({ error: "content is required" });
            return;
          }
          const generated = await GemmaService.generateQuiz({
            content,
            questionCount: questionCount ? Number(questionCount) : 5,
            subject: subject || "General",
            grade,
          });
          res.status(200).json(generated);
        } catch (err: any) {
          res.status(500).json({ error: err.message || "Failed to generate quiz" });
        }
      },
    },
  ],
});
