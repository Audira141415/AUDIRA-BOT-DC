import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Campaigns, Broadcasts & CRM...');

  // 1. Seed Campaigns
  const campaigns = [
    {
      name: 'Q2_NETWORK_OPTIMIZATION',
      description: 'Mass awareness for upcoming redundant fiber link rollout',
      content: '🚨 ATENSI PELANGGAN: Kami akan melakukan optimasi jaringan fiber optic pada 25 April. Koneksi Anda mungkin terganggu selama 10 menit. Terima kasih atas kesabarannya. #AudiraNetwork',
      status: 'RUNNING',
      targetPlatform: null,
      targetSegment: 'All',
      createdBy: 'admin',
    },
    {
      name: 'REVENUE_BOOST_RAMADAN',
      description: 'Special promotion for Ramadan bandwidth upgrades',
      content: '🌙 Promo Ramadan! Upgrade bandwidth Anda sekarang dan dapatkan diskon 30% selama 3 bulan pertama. Balas !promo untuk aktivasi instan.',
      status: 'SCHEDULED',
      targetPlatform: 'WHATSAPP',
      targetSegment: 'VIP',
      createdBy: 'admin',
      scheduledAt: new Date(Date.now() + 86400000 * 2),
    },
    {
      name: 'CUSTOMER_SATISFACTION_SURVEY_2026',
      description: 'Annual CSAT gathering initiative',
      content: 'Halo! Kami ingin mendengar pendapat Anda tentang layanan AudiraBot. Mohon luangkan 2 menit untuk mengisi survei kami: https://survey.audira.com. Dapatkan voucher menarik!',
      status: 'DRAFT',
      targetPlatform: 'TELEGRAM',
      targetSegment: 'Regular',
      createdBy: 'admin',
    }
  ];

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.name },
      create: { ...c, id: c.name },
      update: c
    });
  }

  // 2. Seed Broadcasts
  const broadcasts = [
    {
      title: 'Emergency: Int Gateway Outage',
      content: '⚠️ PEMBERITAHUAN MENDESAK: Gateway Internasional sedang mengalami gangguan teknis. Tim sedang dalam proses pemulihan.',
      targetPlatform: null,
      status: 'COMPLETED',
      totalRecipients: 520,
      successCount: 512,
      failureCount: 8,
      createdBy: 'admin',
    },
    {
      title: 'Update: Int Gateway Restored',
      content: '✅ UPDATE JARINGAN: Gangguan gateway internasional telah teratasi. Seluruh trafik kembali normal.',
      targetPlatform: null,
      status: 'COMPLETED',
      totalRecipients: 520,
      successCount: 498,
      failureCount: 22,
      createdBy: 'admin',
    }
  ];

  for (const b of broadcasts) {
    await prisma.broadcastMessage.create({ data: b });
  }

  // 3. Seed CRM Contacts
  const contacts = [
    {
      name: 'Budi Santoso',
      email: 'budi.santoso@example.com',
      phone: '628123456789',
      segment: 'VIP',
      company: 'PT Maju Terus',
    },
    {
      name: 'Siti Aminah',
      email: 'siti.aminah@example.com',
      phone: '628567890123',
      segment: 'Regular',
      company: 'CV Makmur Jaya',
    },
    {
      name: 'Andi Wijaya',
      email: 'andi.wijaya@example.com',
      phone: '628998877665',
      segment: 'Lead',
      company: 'Indie Studio',
    }
  ];

  for (const contact of contacts) {
    await prisma.cRMContact.create({ data: contact });
  }

  console.log('Successfully seeded Campaigns, Broadcasts & CRM.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
