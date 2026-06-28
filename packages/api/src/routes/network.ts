import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppContext } from '../app';

export default async function networkRoutes(app: FastifyInstance, ctx: AppContext) {
  
  app.get('/map-status', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Fetch all unique locations from the database
    const dbLocations = await ctx.db.maintenanceSchedule.findMany({
      where: { location: { not: null } },
      select: { location: true },
      distinct: ['location']
    });

    // Default coordinate mapping for known areas
    const getCoords = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('batam center')) return { lat: 1.1278, lng: 104.0526 };
      if (lower.includes('panbil')) return { lat: 1.0827, lng: 104.0375 };
      if (lower.includes('nagoya')) return { lat: 1.1450, lng: 104.0150 };
      if (lower.includes('tanjung uncang')) return { lat: 1.0500, lng: 103.9300 };
      if (lower.includes('pih')) return { lat: 1.1210, lng: 104.0510 };
      if (lower.includes('kepri mall')) return { lat: 1.1020, lng: 104.0350 };
      if (lower.includes('engku putri')) return { lat: 1.1250, lng: 104.0530 };
      
      // Random offset for others so they don't stack
      return { 
        lat: 1.12 + (Math.random() - 0.5) * 0.1, 
        lng: 104.05 + (Math.random() - 0.5) * 0.1 
      };
    };

    const mapData = await Promise.all(dbLocations.map(async (dbLoc) => {
      const locName = dbLoc.location || 'Unknown';
      const coords = getCoords(locName);

      // Check for open incidents or SLA breaches
      const criticalCount = await ctx.db.ticket.count({
        where: {
          location: { contains: locName, mode: 'insensitive' },
          status: { in: ['OPEN', 'ESCALATED'] },
          OR: [
            { priority: 'CRITICAL' },
            { slaTracking: { OR: [{ responseBreached: true }, { resolutionBreached: true }] } }
          ]
        }
      });

      // Check for PM due today
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const warningCount = await ctx.db.maintenanceSchedule.count({
        where: {
          location: { contains: locName, mode: 'insensitive' },
          nextDueDate: { lte: endOfDay }
        }
      });

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalCount > 0) status = 'critical';
      else if (warningCount > 0) status = 'warning';

      return {
        id: locName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: locName,
        ...coords,
        status,
        metrics: {
          critical: criticalCount,
          warning: warningCount
        }
      };
    }));

    // Sort to keep critical/warning at top of list
    mapData.sort((a, b) => {
      const score = (s: string) => s === 'critical' ? 2 : (s === 'warning' ? 1 : 0);
      return score(b.status) - score(a.status);
    });

    return reply.send({ data: mapData });
  });

  // Feature 4: Shift Handover Summary
  app.get('/shift-handover', async (_request: FastifyRequest, reply: FastifyReply) => {
    const openTickets = await ctx.db.ticket.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const summary = {
      timestamp: new Date().toISOString(),
      openTicketCount: openTickets.length,
      criticalCount: openTickets.filter((t: any) => t.priority === 'CRITICAL').length,
      tickets: openTickets.map((t: any) => ({
        number: t.ticketNumber,
        customer: t.customer,
        priority: t.priority,
        status: t.status,
        age: Math.floor((Date.now() - t.createdAt.getTime()) / 3600000) + 'h'
      }))
    };

    return reply.send({ data: summary });
  });

  app.post('/diagnose', async (request: FastifyRequest, reply: FastifyReply) => {
    const { host } = request.body as { host: string };
    if (!host) {
      return reply.status(400).send({ error: 'Host parameter is required' });
    }
    
    // Command injection sanitation
    if (!/^[a-zA-Z0-9\.\-_:]+$/.test(host)) {
      return reply.status(400).send({ error: 'Invalid hostname format' });
    }
    
    ctx.logger.info(`Running network diagnostics for host: ${host}`);
    const result = await pingHost(host);
    return reply.send({ success: true, data: result });
  });
}

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

async function pingHost(host: string): Promise<{ online: boolean; latency: number; loss: number; output: string }> {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? `ping -n 3 ${host}` : `ping -c 3 ${host}`;
  try {
    const { stdout } = await execAsync(command);
    
    let latency = 0;
    let loss = 0;
    
    if (isWindows) {
      const avgMatch = stdout.match(/Average\s*=\s*(\d+)ms/);
      if (avgMatch) latency = parseInt(avgMatch[1], 10);
      
      const lossMatch = stdout.match(/Lost\s*=\s*\d+\s*\((\d+)%\s*loss\)/);
      if (lossMatch) loss = parseInt(lossMatch[1], 10);
    } else {
      const avgMatch = stdout.match(/rtt\s*min\/avg\/max\/mdev\s*=\s*[\d\.]+\/([\d\.]+)\//);
      if (avgMatch) latency = parseFloat(avgMatch[1]);
      
      const lossMatch = stdout.match(/(\d+)%\s*packet\s*loss/);
      if (lossMatch) loss = parseInt(lossMatch[1], 10);
    }
    
    return {
      online: loss < 100,
      latency,
      loss,
      output: stdout
    };
  } catch (err) {
    return {
      online: false,
      latency: 0,
      loss: 100,
      output: (err as Error).message
    };
  }
}

