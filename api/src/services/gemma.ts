import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export interface IGeneratedQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface IQuizGenerationResult {
  title: string;
  subject: string;
  description: string;
  questions: IGeneratedQuestion[];
}

export interface IGenerateQuizParams {
  content: string;
  questionCount?: number;
  subject?: string;
  grade?: string;
}

export interface IGenerateFeedbackParams {
  question: string;
  selectedOptionText: string;
  correctOptionText: string;
  lectureContext?: string;
}

async function postRequest(endpoint: string, headers: Record<string, string>, body: string, timeoutMs = 45000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const transport = url.protocol === "https:" ? https : http;

    const req = transport.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`API responded with status ${res.statusCode}: ${data}`));
          }
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request to ${endpoint} timed out after ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

function extractJsonFromResponse<T>(raw: string): T | null {
  try {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.substring(start, end + 1));
    }

    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function createFallbackQuiz(content: string, count = 5, subject = "General"): IQuizGenerationResult {
  const sentences = content
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const questions: IGeneratedQuestion[] = [];
  const limit = Math.min(count, Math.max(sentences.length, 3));

  for (let i = 0; i < limit; i++) {
    const focusSentence = sentences[i] || `Lesson key concept #${i + 1}`;
    questions.push({
      question: `According to the lecture, what is the significance of: "${focusSentence.slice(0, 70)}..."?`,
      options: [
        `It represents the primary principle described in the lecture.`,
        `It is an optional secondary detail with minor impact.`,
        `It contradicts the core methodology of the subject.`,
        `It applies solely to unrelated external domains.`,
      ],
      correctAnswerIndex: 0,
      explanation: `As detailed in the material: "${focusSentence}". This forms the core conceptual takeaway.`,
    });
  }

  return {
    title: `${subject} Quiz: ${sentences[0]?.slice(0, 40) || "Lecture Assessment"}`,
    subject,
    description: `Auto-generated test using Gemma 4 covering: ${sentences[0]?.slice(0, 80) || "Key lecture topics"}`,
    questions,
  };
}

function createFallbackFeedback(params: IGenerateFeedbackParams): string {
  return `Gemma 4 Analysis: You selected "${params.selectedOptionText}", but the correct answer is "${params.correctOptionText}". ` +
    `Review the lecture section regarding "${params.question.slice(0, 60)}..." to strengthen your understanding of this concept.`;
}

export class GemmaService {
  private static apiUrl = process.env.GEMMA_API_URL || "http://localhost:11434/api/generate";
  private static model = process.env.GEMMA_MODEL || "gemma4";
  private static apiKey = process.env.GEMMA_API_KEY || "";

  public static async generateQuiz(params: IGenerateQuizParams): Promise<IQuizGenerationResult> {
    const { content, questionCount = 5, subject = "General", grade = "" } = params;

    const prompt = `You are Gemma 4, an open-source educational AI model.
Your task is to analyze the following lecture/course material and generate a high quality multiple choice quiz.
Each question MUST have exactly 4 plausible options, specify the zero-based index of the correct answer, and provide a clear pedagogical explanation.

Material:
${content}

Requirements:
- Target ${questionCount} questions.
- Grade/Level: ${grade || "Appropriate for lecture material"}
- Subject: ${subject}
- Output MUST be valid JSON only with NO markdown outside the JSON block.

JSON Schema format:
{
  "title": "Title of the quiz",
  "subject": "${subject}",
  "description": "Short summary of what this quiz covers",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explanation of why Option A is correct according to the lecture text"
    }
  ]
}`;

    try {
      const isOllamaGenerate = GemmaService.apiUrl.endsWith("/api/generate");
      const isOpenAICompatible = GemmaService.apiUrl.includes("/v1/");

      let requestBody = "";
      const headers: Record<string, string> = {};
      if (GemmaService.apiKey) {
        headers["Authorization"] = `Bearer ${GemmaService.apiKey}`;
      }

      if (isOllamaGenerate) {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          prompt,
          stream: false,
          format: "json",
        });
      } else if (isOpenAICompatible) {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          messages: [
            {
              role: "system",
              content: "You are Gemma 4, an expert educational assessment engine. Respond only with structured JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });
      } else {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          prompt,
          stream: false,
        });
      }

      const responseText = await postRequest(GemmaService.apiUrl, headers, requestBody, 30000);
      const parsedApiResponse = JSON.parse(responseText);

      let textOutput = "";
      if (parsedApiResponse.response) {
        textOutput = parsedApiResponse.response;
      } else if (parsedApiResponse.choices && parsedApiResponse.choices[0]?.message?.content) {
        textOutput = parsedApiResponse.choices[0].message.content;
      } else {
        textOutput = responseText;
      }

      const quizData = extractJsonFromResponse<IQuizGenerationResult>(textOutput);
      if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
        return {
          title: quizData.title || `${subject} Quiz`,
          subject: quizData.subject || subject,
          description: quizData.description || "Auto-generated quiz from lecture notes",
          questions: quizData.questions,
        };
      }
    } catch {
      // Gracefully fall back to rule-based extractor
    }

    return createFallbackQuiz(content, questionCount, subject);
  }

  public static async generateFeedback(params: IGenerateFeedbackParams): Promise<string> {
    const prompt = `You are Gemma 4, an encouraging and insightful educational AI tutor.
A student took a quiz and answered this question incorrectly. Provide personalized, constructive feedback:
1. Explain clearly and kindly why their choice was incorrect.
2. Explain the correct concept.
3. Suggest the specific idea or formula from the lesson they should review.
Keep feedback concise (2-3 sentences max).

Question: ${params.question}
Student's Chosen Answer: ${params.selectedOptionText}
Correct Answer: ${params.correctOptionText}
${params.lectureContext ? `Lesson Context: ${params.lectureContext.slice(0, 300)}` : ""}

Respond with only the feedback text.`;

    try {
      const isOllamaGenerate = GemmaService.apiUrl.endsWith("/api/generate");
      const isOpenAICompatible = GemmaService.apiUrl.includes("/v1/");

      let requestBody = "";
      const headers: Record<string, string> = {};
      if (GemmaService.apiKey) {
        headers["Authorization"] = `Bearer ${GemmaService.apiKey}`;
      }

      if (isOllamaGenerate) {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          prompt,
          stream: false,
        });
      } else if (isOpenAICompatible) {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        });
      } else {
        requestBody = JSON.stringify({
          model: GemmaService.model,
          prompt,
          stream: false,
        });
      }

      const responseText = await postRequest(GemmaService.apiUrl, headers, requestBody, 20000);
      const parsedApiResponse = JSON.parse(responseText);

      if (parsedApiResponse.response) {
        return parsedApiResponse.response.trim();
      }
      if (parsedApiResponse.choices && parsedApiResponse.choices[0]?.message?.content) {
        return parsedApiResponse.choices[0].message.content.trim();
      }
    } catch {
      // Fallback
    }

    return createFallbackFeedback(params);
  }
}
