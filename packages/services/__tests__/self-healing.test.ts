const { SelfHealingService } = require('../dist/SelfHealingService');

describe('SelfHealingService', () => {
  let db: any;
  let logger: any;

  beforeEach(() => {
    db = {
      botConfig: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      serverLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  it('initializes monitoring loop and logs frequency', () => {
    const service = new SelfHealingService(db, logger, false);
    service.start(60000);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Self-Healing protocol initialized with frequency: 60000ms')
    );
    service.stop();
  });

  it('detects offline bots and triggers development recovery simulation', async () => {
    const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    db.botConfig.findMany.mockResolvedValue([
      {
        platform: 'WHATSAPP',
        connectionStatus: 'DISCONNECTED',
        lastConnectedAt: pastDate,
      },
    ]);

    const service = new SelfHealingService(db, logger, false); // dev mode
    await (service as any).performHealthCheck();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('ANOMALY DETECTED: [WHATSAPP] offline')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[Self-Healing-Dev] Recovery simulated for: whatsapp')
    );
  });
});
