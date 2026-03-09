export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    const { results } = await env.DB.prepare("SELECT * FROM tags ORDER BY created_at ASC").all();
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { name, color } = body;
    
    const newTag = await env.DB.prepare(
      "INSERT INTO tags (name, color) VALUES (?, ?) RETURNING *"
    ).bind(name, color || "gray").first();
    
    return Response.json(newTag);
  } catch (error) {
    return Response.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
