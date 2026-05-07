interface Env {}

export const onRequestPost = async (context: any) => {
  try {
    const { url }: any = await context.request.json();
    if (!url) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { "content-type": "application/json" } });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal as any,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    clearTimeout(timeoutId);

    const isAlive = response.status >= 200 && response.status < 400;
    return new Response(JSON.stringify({ status: response.status, alive: isAlive }), { headers: { "content-type": "application/json" }});
  } catch (error: any) {
    return new Response(JSON.stringify({ status: 500, alive: false, message: error.message }), { headers: { "content-type": "application/json" }});
  }
};
