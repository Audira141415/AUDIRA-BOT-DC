import OpenAI from 'openai';
import { ILogger } from '@pjtaudirabot/core';
import { IAIProvider, AIMessage, AIResponse, AIRequestOptions } from './types';

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;

  constructor(
    apiKey: string,
    model: string,
    temperature: number,
    private logger: ILogger
  ) {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = model;
    this.defaultTemperature = temperature;
  }

  async chat(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> {
    const model = options?.model ?? this.defaultModel;
    const temperature = options?.temperature ?? this.defaultTemperature;
    const maxTokens = options?.maxTokens ?? 1024;

    this.logger.debug('OpenAI request', { model, messageCount: messages.length });

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => {
        if (typeof m.content === 'string') {
          return { role: m.role, content: m.content };
        }
        return {
          role: m.role,
          content: m.content.map((part) => {
            if (part.type === 'text') {
              return { type: 'text', text: part.text ?? '' };
            }
            return {
              type: 'image_url',
              image_url: { url: part.image_url?.url ?? '' },
            };
          }) as any,
        };
      }),
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama';

  constructor(
    private endpoint: string,
    private defaultModel: string,
    private logger: ILogger
  ) {}

  async chat(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> {
    const model = options?.model ?? this.defaultModel;
    const url = `${this.endpoint.replace(/\/$/, '')}/api/chat`;

    this.logger.debug('Ollama request', { model, url, messageCount: messages.length });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama API returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as any;
      const content = data.message?.content;

      if (!content) {
        throw new Error('Empty response from Ollama');
      }

      return {
        content,
        model,
        usage: {
          promptTokens: data.prompt_eval_count ?? 0,
          completionTokens: data.eval_count ?? 0,
          totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
        },
      };
    } catch (err) {
      this.logger.error('Ollama connection failed', err as Error);
      throw err;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock';

  constructor(private logger: ILogger) {}

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const lastMessage = messages[messages.length - 1];
    this.logger.debug('Mock AI request', { content: lastMessage?.content });

    return {
      content: `[Mock AI] You said: "${lastMessage?.content ?? ''}"`,
      model: 'mock-v1',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

