export const onRequest: PagesFunction<{ DB: D1Database, GEMINI_API_KEY: string }> = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { goal } = await request.json() as any;
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return new Response(JSON.stringify({ error: "Vui lòng cấu hình GEMINI_API_KEY trong Cloudflare Dashboard > Settings > Variables." }), { status: 500 });
    }

    const prompt = `Break down this goal into 3 to 5 small, actionable tasks: "${goal}". Return the result in Vietnamese.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                description: { type: "STRING" },
                priority: { type: "STRING" }
              }
            }
          }
        }
      })
    });

    const data = await response.json() as any;
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini API error");
    }

    const text = data.candidates[0].content.parts[0].text;
    const tasks = JSON.parse(text || "[]");
    
    const savedTasks = [];
    for (const task of tasks) {
      const result = await env.DB.prepare(
        "INSERT INTO tasks (title, description, priority, subtasks) VALUES (?, ?, ?, ?)"
      ).bind(task.title, task.description || "", task.priority || "medium", "[]").run();
      
      savedTasks.push({
        id: result.meta.last_row_id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'todo',
        subtasks: []
      });
    }
    
    return new Response(JSON.stringify(savedTasks), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
