export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const id = params.id as string;

  try {
    if (request.method === "GET") {
      if (id) {
        const tag = await env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(id).first();
        if (!tag) return new Response(JSON.stringify({ error: "Tag not found" }), { status: 404 });
        return new Response(JSON.stringify(tag), { headers: { "Content-Type": "application/json" } });
      }
      const tags = await env.DB.prepare("SELECT * FROM tags ORDER BY created_at ASC").all();
      return new Response(JSON.stringify(tags.results || []), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
      const { name, color, description, due_date, assignee } = await request.json() as any;
      if (!name || !name.trim()) {
        return new Response(JSON.stringify({ error: "Tag name is required" }), { status: 400 });
      }
      const result = await env.DB.prepare(
        "INSERT INTO tags (name, color, description, due_date, assignee) VALUES (?, ?, ?, ?, ?)"
      ).bind(name, color || "#64748b", description || null, due_date || null, assignee || null).run();
      
      const newTag = await env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(result.meta.last_row_id).first();
      return new Response(JSON.stringify(newTag), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "PUT") {
      if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
      const { name, color, description, due_date, assignee } = await request.json() as any;
      await env.DB.prepare(
        "UPDATE tags SET name = ?, color = ?, description = ?, due_date = ?, assignee = ? WHERE id = ?"
      ).bind(name, color, description || null, due_date || null, assignee || null, id).run();
      
      const updatedTag = await env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(id).first();
      return new Response(JSON.stringify(updatedTag), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "DELETE") {
      if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
      await env.DB.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
