interface Env {
  LOGIN_KEY?: string;
  VITE_LOGIN_KEY?: string;
}

export const onRequestGet = async (context: any) => {
  const key = context.env.LOGIN_KEY || context.env.VITE_LOGIN_KEY;
  return new Response(JSON.stringify({ authRequired: !!key }), {
    headers: { "content-type": "application/json" }
  });
};

export const onRequestPost = async (context: any) => {
  const key = context.env.LOGIN_KEY || context.env.VITE_LOGIN_KEY;
  if (!key) {
    return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
  }
  
  try {
    const body: any = await context.request.json();
    if (body.key === key) {
       return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: false, error: "Invalid key" }), { 
      status: 401, 
      headers: { "content-type": "application/json" } 
    });
  } catch(e) {
    return new Response(JSON.stringify({ success: false, error: "Bad request" }), { 
      status: 400, 
      headers: { "content-type": "application/json" } 
    });
  }
};
