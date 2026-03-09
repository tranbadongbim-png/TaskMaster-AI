export async function onRequestPut(context: any) {
  try {
    const { request, env, params } = context;
    const id = params.id;
    const body = await request.json();
    const { name, color } = body;

    const updatedTag = await env.DB.prepare(
      "UPDATE tags SET name = ?, color = ? WHERE id = ? RETURNING *"
    ).bind(name, color, id).first();

    if (!updatedTag) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

    return Response.json(updatedTag);
  } catch (error) {
    return Response.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  try {
    const { env, params } = context;
    const id = params.id;
    
    // Set tag_id to null for tasks using this tag
    await env.DB.prepare("UPDATE tasks SET tag_id = NULL WHERE tag_id = ?").bind(id).run();
    
    await env.DB.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
