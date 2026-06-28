/**
 * @module SentimentService
 * @description Advanced sentiment analysis using OpenAI with rule-based fallback.
 * @author Audira Engineering
 */
import { ILogger } from '@pjtaudirabot/core';

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

export type SentimentResult = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT';

export class SentimentService {
  private openai: OpenAI | null = null;

  constructor(
    private db: PrismaClient,
    private logger: ILogger,
    apiKey?: string
  ) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Analyze message content for sentiment and urgency.
   * Fallback to basic rule-based analysis if OpenAI is not available.
   */
  async analyze(content: string): Promise<{ sentiment: SentimentResult; score: number }> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Analyze the sentiment and urgency of the message. Respond with a single word: POSITIVE, NEUTRAL, NEGATIVE, or URGENT.' 
            },
            { role: 'user', content }
          ],
          max_tokens: 10,
        });

        const result = response.choices[0].message.content?.toUpperCase() as SentimentResult;
        return { 
          sentiment: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'URGENT'].includes(result) ? result : 'NEUTRAL',
          score: result === 'URGENT' ? 1.0 : result === 'POSITIVE' ? 0.8 : result === 'NEGATIVE' ? 0.2 : 0.5
        };
      }
    } catch (err) {
      this.logger.error('Sentiment analysis failed, falling back to basic rules', err instanceof Error ? err : new Error(String(err)));
    }

    // Basic Rule-based Fallback
    const lowerContent = content.toLowerCase();
    if (lowerContent.match(/tolong|bantu|urgent|penting|cepat/)) return { sentiment: 'URGENT', score: 0.9 };
    if (lowerContent.match(/bagus|terima kasih|ok|mantap|siap/)) return { sentiment: 'POSITIVE', score: 0.8 };
    if (lowerContent.match(/kecewa|lambat|buruk|jelek|tidak puas/)) return { sentiment: 'NEGATIVE', score: 0.2 };

    return { sentiment: 'NEUTRAL', score: 0.5 };
  }

  /**
   * Stores the analyzed sentiment for a message in the database for dashboard visualization.
   */
  async recordSentiment(logId: string, content: string) {
    const { sentiment, score } = await this.analyze(content);
    
    try {
      await this.db.chatLog.update({
        where: { id: logId },
        data: {
          extractedData: {
            sentiment,
            sentimentScore: score,
            analyzedAt: new Date().toISOString()
          }
        }
      });
      
      if (sentiment === 'URGENT') {
        this.logger.warn(`URGENT SIGNAL DETECTED: [ChatLog ${logId}]`);
      }
    } catch (err) {
      this.logger.error('Failed to record chat sentiment', err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Generates 3 suggested replies based on chat message context.
   */
  async suggestReply(message: string): Promise<string[]> {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert customer support agent. Generate 3 short, professional suggested replies to the user\'s message. Respond strictly with a JSON array of 3 strings, e.g. ["Option 1", "Option 2", "Option 3"]. Do not include markdown formatting or extra text.'
            },
            { role: 'user', content: message }
          ],
          max_tokens: 150,
        });
        const content = response.choices[0].message.content || '[]';
        const match = content.match(/\[.*\]/s);
        if (match) {
          const arr = JSON.parse(match[0]);
          if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, 3);
        }
      } catch (err) {
        this.logger.error('OpenAI suggestReply failed', err as Error);
      }
    }

    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT;
    if (process.env.AI_PROVIDER === 'ollama' && ollamaEndpoint) {
      try {
        const model = process.env.OLLAMA_MODEL || 'llama3';
        const url = `${ollamaEndpoint.replace(/\/$/, '')}/api/chat`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert customer support agent. Generate 3 short, professional suggested replies to the user\'s message. Respond strictly with a JSON array of 3 strings, e.g. ["Option 1", "Option 2", "Option 3"]. Do not include markdown formatting or extra text.'
              },
              { role: 'user', content: message }
            ],
            stream: false,
          })
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.message?.content || '';
          const match = text.match(/\[.*\]/s);
          if (match) {
            const arr = JSON.parse(match[0]);
            if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, 3);
          }
        }
      } catch (err) {
        this.logger.error('Ollama suggestReply failed', err as Error);
      }
    }

    return [
      'Mohon maaf atas ketidaknyamanannya. Kami sedang menyelidiki masalah ini.',
      'Baik, tiket gangguan Anda sudah kami buat. Tim kami akan segera menuju lokasi.',
      'Terima kasih atas laporannya. Boleh kami tahu VLAN ID atau nomor pelanggan Anda?'
    ];
  }
}

