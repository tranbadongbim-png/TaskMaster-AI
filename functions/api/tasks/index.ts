export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
    const parsedTasks = results.map((t) => ({
      ...t,
      subtasks: JSON.parse(t.subtasks || '[]')
    }));
    return Response.json(parsedTasks);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { title, description, priority, due_date, subtasks } = body;
    const subtasksStr = JSON.stringify(subtasks || []);
    
    // D1 supports RETURNING
    const info = await env.DB.prepare(
      "INSERT INTO tasks (title, description, priority, due_date, subtasks) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(title, description || "", priority || "medium", due_date || null, subtasksStr).first();
    
    return Response.json({ ...info, subtasks: JSON.parse(info.subtasks || '[]') });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
