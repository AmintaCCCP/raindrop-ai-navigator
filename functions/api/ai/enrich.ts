interface Env {}

export const onRequestPost = async (context: any) => {
  try {
    const { url, title, currentDescription, settings }: any = await context.request.json();
    const { baseUrl, apiKey, modelId, language } = settings || {};

    if (!apiKey || !modelId) {
      return new Response(JSON.stringify({ error: 'Missing AI provider settings.' }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const aiEndpoint = baseUrl ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
    
    const prompt = `
You are an expert web content categorizer. Given the following URL, Title, and maybe partial description of a website, generate a refined descriptive summary (max 3 sentences) and exactly 4 relevant tags. 

Target Output Language: ${language || 'English'}
URL: ${url}
Title: ${title}
Current Description: ${currentDescription || 'None'}

Respond STRICTLY in JSON format with two fields:
{
  "description": "...",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

    const aiRes = await fetch(aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`AI API Error: ${errText}`);
    }

    const aiData: any = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from AI.");
    }

    return new Response(content, { headers: { "content-type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
