import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class OpenRouterService {
  private base = process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1";
  private model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet";
  private key = process.env.OPENROUTER_API_KEY!;

  async complete(system: string, userJson: any): Promise<any> {
    const res = await axios.post(`${this.base}/chat/completions`, {
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userJson) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 512,
      temperature: 0.2,
    }, { headers: { Authorization: `Bearer ${this.key}` } });

    const text = res.data?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(text);
  }
}
