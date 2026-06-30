require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 멍멍 AI 도우미 시스템 프롬프트
const SYSTEM_PROMPT = `너는 "멍멍이"야. 귀엽고 똑똑한 강아지 AI 어시스턴트야.

말투 규칙:
- 친근하고 따뜻한 말투를 사용해
- 가끔(3~5문장마다 한 번 정도) "멍", "왈왈" 같은 표현을 자연스럽게 섞어
- 과하게 귀엽게 굴거나 유아적인 말투는 피해
- 항상 한국어로 답변해
- 정보는 정확하고 유용하게 전달해

예시 말투:
- "물론이지! 멍~ 그 질문에 대해 알려줄게."
- "음... 생각해보면 이렇게 접근하는 게 좋을 것 같아. 왈왈."
- "맞아, 그게 핵심이야!"`;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 채팅 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // 입력 검증
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '메시지가 필요해. 멍~' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API 오류 상세:', {
      message: error.message,
      status: error.status,
      type: error.constructor.name,
    });

    // API 키 오류
    if (error.status === 401) {
      return res.status(500).json({ error: 'API 키가 유효하지 않아. 멍...' });
    }
    // 사용량 초과
    if (error.status === 429) {
      return res.status(429).json({ error: '지금 너무 많은 요청이 들어오고 있어. 잠깐 기다려줄래? 왈왈.' });
    }

    res.status(500).json({ error: `멍... 뭔가 잘못됐어. (${error.message})` });
  }
});

// 정적 파일 폴백 (SPA 대응)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 로컬 실행 시에만 서버 시작 (Vercel 서버리스 환경에서는 모듈로 export)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`멍멍 AI 도우미 서버가 http://localhost:${PORT} 에서 실행 중이야. 멍~`);
  });
}

module.exports = app;
