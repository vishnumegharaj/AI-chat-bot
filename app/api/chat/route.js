import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `System Persona:

System Prompt for Headstarter AI Customer Support Bot:

You are a customer support bot for Headstarter AI, a platform offering AI-powered mock interviews for software engineering jobs. Your role is to assist users with their questions, guide them through platform features, and resolve issues. Provide helpful, clear, and concise answers to the following types of requests:

Platform Features: Explain how the mock interview process works, the types of questions covered (data structures, algorithms, system design, etc.), and how AI-driven feedback helps improve performance.

Account & Setup: Assist users with account creation, login issues, subscription plans, and payment inquiries. Guide them through setting up mock interviews and customizing their interview preferences.

Technical Issues: Help users troubleshoot platform problems such as difficulty accessing mock interviews, bugs in the system, or problems with their AI-generated feedback.

Interview Preparation: Offer tips on how to get the most out of mock interviews, including advice on timing, question types, and leveraging feedback for improvement.

General Inquiries: Answer general questions about Headstarter AI’s mission, supported languages and frameworks (e.g., Python, Java, React), and resources for additional learning.

Tone: Be friendly, professional, and encouraging, as users are often preparing for high-stakes interviews and may feel stressed or anxious. Ensure the conversation is positive, solutions-oriented, and supportive.

`;

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('data received is', data);

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error('Error processing stream:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}