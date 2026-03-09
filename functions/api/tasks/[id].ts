export async function onRequestPut({ request, env, params }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const currentTask = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
    if (!currentTask) return Response.json({ error: "Task not found" }, { status: 404 });

    const newStatus = body.status !== undefined ? body.status : currentTask.status;
    const newTitle = body.title !== undefined ? body.title : currentTask.title;
    const newDesc = body.description !== undefined ? body.description : currentTask.description;
    const newPriority = body.priority !== undefined ? body.priority : currentTask.priority;
    const newDueDate = body.due_date !== undefined ? body.due_date : currentTask.due_date;
    const newSubtasks = body.subtasks !== undefined ? JSON.stringify(body.subtasks) : currentTask.subtasks;
    const newNotes = body.notes !== undefined ? body.notes : currentTask.notes;

    const updatedTask = await env.DB.prepare(
      "UPDATE tasks SET status = ?, title = ?, description = ?, priority = ?, due_date = ?, subtasks = ?, notes = ? WHERE id = ? RETURNING *"
    ).bind(newStatus, newTitle, newDesc, newPriority, newDueDate, newSubtasks, newNotes, id).first();
    
    return Response.json({ ...updatedTask, subtasks: JSON.parse(updatedTask.subtasks || '[]') });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const id = params.id;
    await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
