import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  return Response.json({
    status: "Life Board API route works",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const situation = body.situation;
    const decisionType = body.decisionType || "General life decision";
    const urgency = body.urgency || "Medium";
    const emotionalState = body.emotionalState || "Confused";

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OpenAI API key." },
        { status: 500 }
      );
    }

    if (!situation) {
      return Response.json(
        { error: "Situation is required." },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a wise personal board of directors. You help the user think through life decisions comprehensively across financial, career, family, health, romantic, community, and personal growth dimensions. Be direct, practical, and emotionally grounded. Always return valid JSON only. No markdown. No backticks.",
        },
        {
          role: "user",
          content: `
The user is thinking through this situation:

${situation}

Context:
Decision type: ${decisionType}
Urgency: ${urgency}
Emotional state: ${emotionalState}

Return exactly this JSON structure:

{
  "advisors": {
    "financial": {
      "title": "Financial Advisor",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "career": {
      "title": "Career Strategist",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "family": {
      "title": "Family Advisor",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "healthFitness": {
      "title": "Health & Fitness Coach",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "romantic": {
      "title": "Romantic Life Advisor",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "community": {
      "title": "Community Advisor",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    },
    "personalGrowth": {
      "title": "Personal Growth Guide",
      "perspective": "string",
      "whatYouMayBeMissing": "string",
      "advice": "string",
      "question": "string"
    }
  },
  "chair": {
    "title": "Board Chair",
    "integratedRecommendation": "string",
    "tradeoffs": "string",
    "nextThreeActions": "string",
    "groundingReminder": "string"
  }
}

Make the advice specific. Avoid generic life advice.
          `,
        },
      ],
    });

    const text = completion.choices[0].message.content;

    if (!text) {
      return Response.json(
        { error: "OpenAI returned an empty response." },
        { status: 500 }
      );
    }

    const boardResponse = JSON.parse(text);

    return Response.json(boardResponse);
  } catch (error) {
    console.error("Life Board API error:", error);

    return Response.json(
      { error: "Something went wrong generating board advice." },
      { status: 500 }
    );
  }
}