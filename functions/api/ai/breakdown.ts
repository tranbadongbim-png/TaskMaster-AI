import { GoogleGenAI, Type } from "@google/genai";

export async function onRequestPost({ request, env }) {
  try {
    const { goal } = await request.json();
    let apiKey = env.GEMINI_API_KEY1 || env.GEMINI_API_KEY;
    if (apiKey && apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.slice(1, -1);
    }
    
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return Response.json({ error: "Vui lòng cấu hình Gemini API Key thật trong phần Settings của Cloudflare." }, { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down this goal into 3 to 5 small, actionable tasks: "${goal}". Return the result in Vietnamese.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên công việc ngắn gọn" },
              description: { type: Type.STRING, description: "Mô tả chi tiết công việc" },
              priority: { type: Type.STRING, description: "Mức độ ưu tiên: 'high', 'medium', hoặc 'low'" }
            }
          }
        }
      }
    });
    
    const tasks = JSON.parse(response.text || "[]");
    
    // Save to DB
    const savedTasks = [];
    for (const task of tasks) {
      const info = await env.DB.prepare(
        "INSERT INTO tasks (title, description, priority, subtasks) VALUES (?, ?, ?, ?) RETURNING *"
      ).bind(task.title, task.description || "", task.priority || "medium", "[]").first();
      
      savedTasks.push({
        ...info,
        subtasks: []
      });
    }
    
    return Response.json(savedTasks);
  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ error: error.message || "Failed to generate tasks" }, { status: 500 });
  }
}
