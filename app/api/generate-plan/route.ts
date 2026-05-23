import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  return Response.json({
    status: "API route works",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const thoughts = body.thoughts;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OpenAI API key. Check .env.local." },
        { status: 500 }
      );
    }

    if (!thoughts) {
      return Response.json(
        { error: "Thoughts are required." },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You turn messy thoughts into clear structured plans. Always return valid JSON only. No markdown. No backticks.",
        },
        {
          role: "user",
          content: `
Turn this into a structured plan.

Return exactly this JSON shape:
{
  "summary": "string",
  "goals": "string",
  "blockers": "string",
  "nextActions": "string",
  "hardTruth": "string"
}

User thoughts:
${thoughts}
          `,
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;

    if (!text) {
      return Response.json(
        { error: "OpenAI returned an empty response." },
        { status: 500 }
      );
    }

    const plan = JSON.parse(text);

    return Response.json(plan);
  } catch (error) {
    console.error("API route error:", error);

    return Response.json(
      { error: "Something went wrong in the backend route." },
      { status: 500 }
    );
  }
}