
import { GoogleGenAI, Type } from "@google/genai";
import { JobListing } from "../types";

export const performJobSearch = async (
  query: string, 
  onLog: (msg: string) => void
): Promise<JobListing[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onLog(`Searching for: "${query}"...`);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional job recruiter. Search for job listings for the query: "${query}". 
      Return a list of current job openings found in the Google Search results.
      Include: Job Title, Company Name, Location, Source Site (e.g. LinkedIn, Indeed), Job Link, and Date Published (e.g. Feb 2024).
      Be as accurate as possible. Only include relevant results in Kenya or Remote for Kenya.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  location: { type: Type.STRING },
                  source: { type: Type.STRING },
                  link: { type: Type.STRING },
                  datePublished: { type: Type.STRING }
                },
                required: ["title", "company", "link"]
              }
            }
          }
        }
      },
    });

    const jsonStr = response.text.trim();
    const data = JSON.parse(jsonStr);
    
    if (data.jobs && Array.isArray(data.jobs)) {
      onLog(`Found ${data.jobs.length} potential listings for this query.`);
      return data.jobs.map((j: any) => ({
        ...j,
        id: Math.random().toString(36).substr(2, 9),
        querySource: query
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Search error:", error);
    onLog(`Error searching for "${query}": ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

export interface EmailDraft {
  subject: string;
  body: string;
}

export const summarizeReport = async (jobs: JobListing[]): Promise<EmailDraft> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on these ${jobs.length} job listings found today, draft a professional email. 
    Context: ${JSON.stringify(jobs.slice(0, 10))}...
    Return a JSON object with 'subject' and 'body'. The body should be a professional 2-paragraph summary.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          body: { type: Type.STRING }
        },
        required: ["subject", "body"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    return {
      subject: `📌 Daily Google-Sourced MEL Jobs - ${new Date().toLocaleDateString()}`,
      body: `Attached is the latest report containing ${jobs.length} Monitoring & Evaluation job opportunities across Kenya.`
    };
  }
};
