import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Thu thập danh sách các API Key từ biến môi trường
const getApiKeys = () => {
  const keys = [];
  // Thử lấy GEMINI_API_KEY (mặc định)
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  
  // Lấy các key từ API_KEY_1 đến API_KEY_10 (nếu có)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  // Fallback về NEXT_PUBLIC_API_KEY nếu không có key nào khác
  if (keys.length === 0 && process.env.NEXT_PUBLIC_API_KEY) {
    keys.push(process.env.NEXT_PUBLIC_API_KEY);
  }
  
  return keys;
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

export async function POST(req: Request) {
  try {
    if (API_KEYS.length === 0) {
      return NextResponse.json({ error: "No API Keys found. Please set API_KEY_1, API_KEY_2... in .env" }, { status: 500 });
    }

    const { todos } = await req.json();

    // Thử gọi API với cơ chế xoay vòng (Rotation)
    let lastError: any = null;
    
    // Thử tối đa số lượng key có sẵn
    for (let attempts = 0; attempts < API_KEYS.length; attempts++) {
      const activeKey = API_KEYS[currentKeyIndex];
      
      try {
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash", // Dùng model 2.0 Flash thực tế
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const systemInstruction = `You are an intelligent task scheduling assistant.
Your goal is to assign an optimal start time (HH:MM) for each task, starting the day at 06:00.

CRITICAL RULES:
1. SEMANTIC TIME AWARENESS: Carefully read task names and descriptions. If a user mentions a time (e.g., "Meeting at 9am", "Gym after 5pm", "Lunch at noon"), you MUST prioritize and respect those constraints.
2. CONTEXTUAL LOGIC: Arrange tasks feasibility (e.g., breakfast before morning meetings).
3. PRIORITY: Higher priority tasks should generally be placed earlier unless a specific time is mentioned.
4. FORMAT: Return a JSON array of objects: [{"id": string, "time_recommend": "HH:MM"}].
5. Every 'id' from the input MUST be included in the output.
6. NO markdown, NO prose. Only raw JSON.`;

        const prompt = `Tasks: ${JSON.stringify(todos.map(t => ({ id: t.id, name: t.name, priority: t.priority, description: t.description })))}`;

        const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
        const response = await result.response;
        const text = response.text().trim();
        
        let recommendations = JSON.parse(text);
        
        // Xử lý trường hợp AI trả về object bọc ngoài thay vì array
        if (!Array.isArray(recommendations) && typeof recommendations === 'object') {
          const firstKey = Object.keys(recommendations)[0];
          if (Array.isArray(recommendations[firstKey])) {
            recommendations = recommendations[firstKey];
          }
        }

        return NextResponse.json(recommendations);

      } catch (error: any) {
        lastError = error;
        
        // Nếu lỗi là Rate Limit (429), chúng ta sẽ switch sang key tiếp theo
        if (error.status === 429 || error.message?.includes('429')) {
          console.warn(`Key index ${currentKeyIndex} exhausted (429). Switching to next key...`);
          currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
          continue; // Thử lại với key mới
        }
        
        // Nếu là lỗi khác không phải 429, báo lỗi luôn (ví dụ Key không hợp lệ)
        throw error;
      }
    }

    // Nếu đã thử tất cả các key mà vẫn lỗi 429
    return NextResponse.json({ 
      error: "All API keys are currently rate-limited. Please wait a moment." 
    }, { status: 429 });

  } catch (error: any) {
    console.error("Gemini SDK Error details:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
