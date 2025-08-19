import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenRouterService {
  private base = process.env.OPENROUTER_BASE || 'https://openrouter.ai/api/v1';
  private model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet';
  private key = process.env.OPENROUTER_API_KEY || '';

  async complete(system: string, user: any): Promise<string> {
    const res = await axios.post(`${this.base}/chat/completions`, {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: typeof user === 'string' ? user : JSON.stringify(user) }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${this.key}` }
    });
    return res.data.choices?.[0]?.message?.content ?? '{}';
  }
}
