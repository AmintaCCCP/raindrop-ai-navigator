interface Env {
  RAINDROP_API_KEY?: string;
}

const getHeaders = (request: any, env: Env) => {
  const apiKey = request.headers.get('x-raindrop-key') || env.RAINDROP_API_KEY;
  if (!apiKey) throw new Error('RAINDROP_API_KEY is missing');
  return { Authorization: `Bearer ${apiKey}` };
};

export const onRequestGet = async (context: any) => {
  try {
    const id = context.params.id as string;
    const url = new URL(context.request.url);
    const page = url.searchParams.get('page') || '0';
    const perpage = url.searchParams.get('perpage') || '50';
    
    const targetUrl = `https://api.raindrop.io/rest/v1/raindrops/${id}?page=${page}&perpage=${perpage}`;
    const res = await fetch(targetUrl, { headers: getHeaders(context.request, context.env) });
    if (!res.ok) throw new Error(`Raindrop API returned ${res.status}`);
    const data = await res.json();
    
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
};

export const onRequestPut = async (context: any) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json();
    
    const res = await fetch(`https://api.raindrop.io/rest/v1/raindrop/${id}`, { 
      method: 'PUT',
      headers: { ...getHeaders(context.request, context.env), "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Raindrop API returned ${res.status}`);
    const data = await res.json();
    
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = context.params.id as string;
    
    const res = await fetch(`https://api.raindrop.io/rest/v1/raindrop/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(context.request, context.env)
    });
    if (!res.ok) throw new Error(`Raindrop API returned ${res.status}`);
    const data = await res.json();
    
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
