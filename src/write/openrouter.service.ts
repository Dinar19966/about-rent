import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenRouterService {
  private baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private apiKey = process.env.OPENROUTER_API_KEY || '';
  private model  = process.env.OPENROUTER_MODEL  || 'anthropic/claude-3.5-sonnet';

  async completeJSON(system: string, user: string) {
    if (!this.apiKey) throw new Error('OPENROUTER_API_KEY is not set');
    const res = await axios.post(`${this.baseUrl}/chat/completions`, {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/Dinar19966/about-rent',
        'X-Title': 'about-rent',
      },
      timeout: 20000,
      validateStatus: s => s >= 200 && s < 500,
    });
    if (res.status >= 400) throw new Error(`OpenRouter error: ${res.status} ${res.statusText}`);
    const text = res.data?.choices?.[0]?.message?.content || '';
    return text;
  }
}