const { SentimentService } = require('../dist/SentimentService');

describe('SentimentService', () => {
  let db: any;
  let logger: any;

  beforeEach(() => {
    db = {
      chatLog: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  it('uses rule-based fallback when OpenAI API key is missing', async () => {
    const service = new SentimentService(db, logger);

    const urgentRes = await service.analyze('Tolong bantu saya ini urgent!');
    expect(urgentRes.sentiment).toBe('URGENT');
    expect(urgentRes.score).toBe(0.9);

    const positiveRes = await service.analyze('Pelayanan sangat bagus terima kasih banyak');
    expect(positiveRes.sentiment).toBe('POSITIVE');
    expect(positiveRes.score).toBe(0.8);

    const negativeRes = await service.analyze('Saya sangat kecewa layanannya buruk');
    expect(negativeRes.sentiment).toBe('NEGATIVE');
    expect(negativeRes.score).toBe(0.2);

    const neutralRes = await service.analyze('Halo');
    expect(neutralRes.sentiment).toBe('NEUTRAL');
    expect(neutralRes.score).toBe(0.5);
  });

  it('provides default suggested replies when AI services are unavailable', async () => {
    const service = new SentimentService(db, logger);
    const replies = await service.suggestReply('Ada gangguan internet di rumah');

    expect(replies).toHaveLength(3);
    expect(replies[0]).toContain('Mohon maaf');
  });
});
