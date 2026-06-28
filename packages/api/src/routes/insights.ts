import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppContext } from '../app';
import { InsightService, SLAService } from '@pjtaudirabot/services';

export default async function insightsRoutes(app: FastifyInstance, ctx: AppContext) {
  const insightService = new InsightService(ctx.db, ctx.redis, ctx.logger);
  const slaService = new SLAService(ctx.db, ctx.redis, ctx.logger);
  
  app.get('/predictive', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const predictions = await insightService.getPredictiveForecast();
      return reply.send({ data: predictions });
    } catch (err) {
      ctx.logger.error('Insights predictive endpoint failed', err as Error);
      return reply.status(500).send({ error: 'Failed to generate predictions' });
    }
  });

  app.get('/sla/weighted', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();
      const report = await slaService.calculateWeightedMonthlyPerformance(now.getMonth(), now.getFullYear());
      return reply.send({ data: report });
    } catch (err) {
      ctx.logger.error('Insights weighted SLA endpoint failed', err as Error);
      return reply.status(500).send({ error: 'Failed to calculate weighted SLA score' });
    }
  });

  app.post('/suggest-reply', async (request: FastifyRequest, reply: FastifyReply) => {
    const { message } = request.body as { message: string };
    if (!message) {
      return reply.status(400).send({ error: 'Message parameter is required' });
    }
    try {
      const suggestions = await ctx.sentiment.suggestReply(message);
      return reply.send({ data: suggestions });
    } catch (err) {
      ctx.logger.error('Failed to generate suggested replies', err as Error);
      return reply.status(500).send({ error: 'Failed to generate suggestions' });
    }
  });
}
