import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";

const db = new Database("app.db");

// Initialize database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add due_date column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN due_date TEXT`);
  } catch (e) {
    // Column might already exist, ignore error
  }
  
  // Add subtasks column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN subtasks TEXT DEFAULT '[]'`);
  } catch (e) {
    // Column might already exist, ignore error
  }
  
  // Add notes column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN notes TEXT`);
  } catch (e) {
    // Column might already exist, ignore error
  }
} catch (error) {
  console.error("Database initialization error:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
      const parsedTasks = tasks.map((t: any) => ({
        ...t,
        subtasks: JSON.parse(t.subtasks || '[]')
      }));
      res.json(parsedTasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const { title, description, priority, due_date, subtasks, notes } = req.body;
      const subtasksStr = JSON.stringify(subtasks || []);
      const stmt = db.prepare("INSERT INTO tasks (title, description, priority, due_date, subtasks, notes) VALUES (?, ?, ?, ?, ?, ?)");
      const info = stmt.run(title, description || "", priority || "medium", due_date || null, subtasksStr, notes || "");
      const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid) as any;
      res.json({ ...newTask, subtasks: JSON.parse(newTask.subtasks || '[]') });
    } catch (error) {
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", (req, res) => {
    try {
      const { status, title, description, priority, due_date, subtasks, notes } = req.body;
      const id = req.params.id;
      
      const currentTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
      if (!currentTask) return res.status(404).json({ error: "Task not found" });

      const newStatus = status !== undefined ? status : currentTask.status;
      const newTitle = title !== undefined ? title : currentTask.title;
      const newDesc = description !== undefined ? description : currentTask.description;
      const newPriority = priority !== undefined ? priority : currentTask.priority;
      const newDueDate = due_date !== undefined ? due_date : currentTask.due_date;
      const newSubtasks = subtasks !== undefined ? JSON.stringify(subtasks) : currentTask.subtasks;
      const newNotes = notes !== undefined ? notes : currentTask.notes;

      const stmt = db.prepare("UPDATE tasks SET status = ?, title = ?, description = ?, priority = ?, due_date = ?, subtasks = ?, notes = ? WHERE id = ?");
      stmt.run(newStatus, newTitle, newDesc, newPriority, newDueDate, newSubtasks, newNotes, id);
      
      const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
      res.json({ ...updatedTask, subtasks: JSON.parse(updatedTask.subtasks || '[]') });
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // AI Route
  app.post("/api/ai/breakdown", async (req, res) => {
    try {
      const { goal } = req.body;
      let apiKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.startsWith('"') && apiKey.endsWith('"')) {
        apiKey = apiKey.slice(1, -1);
      }
      
      console.log("API Key exists:", !!apiKey);
      console.log("API Key prefix:", apiKey ? apiKey.substring(0, 4) : "none");
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Vui lòng cấu hình Gemini API Key thật trong phần Settings > Secrets của AI Studio." });
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
      const stmt = db.prepare("INSERT INTO tasks (title, description, priority, subtasks) VALUES (?, ?, ?, ?)");
      
      for (const task of tasks) {
        const info = stmt.run(task.title, task.description || "", task.priority || "medium", "[]");
        savedTasks.push({
          id: info.lastInsertRowid,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          subtasks: []
        });
      }
      
      res.json(savedTasks);
    } catch (error: any) {
      console.error("AI Error:", error);
      
      // Handle specific Gemini API errors
      let errorMessage = "Không thể tạo công việc. Vui lòng thử lại sau.";
      if (error.status === 503 || (error.message && error.message.includes("503"))) {
        errorMessage = "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau ít phút.";
      } else if (error.status === 429 || (error.message && (error.message.includes("429") || error.message.includes("Quota exceeded") || error.message.includes("RESOURCE_EXHAUSTED")))) {
        errorMessage = "Bạn đã vượt quá giới hạn số lần sử dụng AI. Vui lòng đợi một lát rồi thử lại.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
