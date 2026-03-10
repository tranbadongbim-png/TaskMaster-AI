export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  try {
    if (request.method === "GET") {
      if (id) {
        const task = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
        if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
        return new Response(JSON.stringify({ ...task, subtasks: JSON.parse((task as any).subtasks || '[]') }), { headers: { "Content-Type": "application/json" } });
      }
      const tasks = await env.DB.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
      const parsedTasks = (tasks.results || []).map((t: any) => ({
        ...t,
        subtasks: JSON.parse(t.subtasks || '[]')
      }));
      return new Response(JSON.stringify(parsedTasks), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
      const { title, description, priority, due_date, subtasks, notes, tag_id } = await request.json() as any;
      const subtasksStr = JSON.stringify(subtasks || []);
      const result = await env.DB.prepare(
        "INSERT INTO tasks (title, description, priority, due_date, subtasks, notes, tag_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(title, description || "", priority || "medium", due_date || null, subtasksStr, notes || "", tag_id || null).run();
      
      const newTask = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(result.meta.last_row_id).first() as any;
      return new Response(JSON.stringify({ ...newTask, subtasks: JSON.parse(newTask.subtasks || '[]') }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "PUT") {
      if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
      const body = await request.json() as any;
      
      const currentTask = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first() as any;
      if (!currentTask) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

      const updates: string[] = [];
      const values: any[] = [];

      const fields = ['status', 'title', 'description', 'priority', 'due_date', 'subtasks', 'notes', 'tag_id'];
      for (const field of fields) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(field === 'subtasks' ? JSON.stringify(body[field]) : body[field]);
        }
      }

      if (updates.length > 0) {
        values.push(id);
        await env.DB.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      }
      
      const updatedTask = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first() as any;
      return new Response(JSON.stringify({ ...updatedTask, subtasks: JSON.parse(updatedTask.subtasks || '[]') }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "DELETE") {
      if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
      await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
