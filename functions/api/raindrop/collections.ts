interface Env {
  RAINDROP_API_KEY?: string;
}

export const onRequestGet = async (context: any) => {
  try {
    const apiKey = context.request.headers.get('x-raindrop-key') || context.env.RAINDROP_API_KEY;
    if (!apiKey) throw new Error('RAINDROP_API_KEY is missing');
    const headers = { Authorization: `Bearer ${apiKey}` };

    const [rootRes, childRes] = await Promise.all([
      fetch('https://api.raindrop.io/rest/v1/collections', { headers }),
      fetch('https://api.raindrop.io/rest/v1/collections/childrens', { headers })
    ]);
    
    // Check if Raindrop API returned errors (like 401 Unauthorized)
    if (!rootRes.ok || !childRes.ok) {
        throw new Error(`Raindrop API returned ${rootRes.status} / ${childRes.status}`);
    }

    const { items: rootItems = [] }: any = await rootRes.json();
    const { items: childItems = [] }: any = await childRes.json();
    
    const items = [...rootItems, ...childItems];
    return new Response(JSON.stringify({ result: true, items }), {
      headers: { "content-type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
