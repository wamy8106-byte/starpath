import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  // 从网址里获取星座名字，比如 /api/horoscope?sign=aries
  const { searchParams } = new URL(request.url);
  const sign = searchParams.get('sign');

  if (!sign) {
    return NextResponse.json({ error: 'Missing sign' }, { status: 400 });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 或者用 "gpt-4o-mini" 更便宜
      messages: [
  { 
    role: "system", 
    content: "You are a master astrologer. Return a JSON object with 3 fields: career, love, and luck. Each field should have a 'score' (1-100) and a 'prediction' (1 short sentence)." 
  },
  { role: "user", content: `Daily horoscope for ${sign}` }
],
// 告诉 AI 我们要 JSON 格式
response_format: { type: "json_object" },
      temperature: 0.7, // 让 AI 的回答有一点点随机性和创造力
    });

    const quote = response.choices[0].message.content;
    const parsedData = JSON.parse(quote || "{}");

    // 加上这一行，把数据结构明确告诉前端
    return NextResponse.json({
      career: parsedData.career || { score: 50, prediction: "Steady day." },
      love: parsedData.love || { score: 50, prediction: "Stay calm." },
      luck: parsedData.luck || { score: 50, prediction: "Be careful." }
    });
  
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'AI is sleeping...' }, { status: 500 });
  }
}