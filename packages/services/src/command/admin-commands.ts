import { CommandContext, CommandResult, ILogger } from '@pjtaudirabot/core';
import { BaseCommandHandler } from './handler';
import { UserService } from '../user';

export class SetRoleCommand extends BaseCommandHandler {
  constructor(
    logger: ILogger,
    private userService: UserService,
  ) {
    super(logger);
  }

  getName() { return 'setrole'; }
  getDescription() { return 'Set user role: !setrole <phone> <user|moderator|admin>'; }
  getCategory() { return 'admin'; }
  getRequiredRole() { return 'admin' as const; }

  async execute(context: CommandContext): Promise<CommandResult> {
    const args = context.input.replace(/^!setrole\s*/i, '').trim().split(/\s+/);
    if (args.length < 2) {
      return { success: false, message: '⚠️ Usage: !setrole <phoneNumber> <user|moderator|admin>' };
    }

    const [phone, role] = args;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return { success: false, message: '⚠️ Role must be: user, moderator, or admin' };
    }

    const ok = await this.userService.promoteToAdmin('whatsapp', phone);
    if (!ok) {
      return { success: false, message: `❌ User with phone ${phone} not found.` };
    }

    // If role is not admin, use setRole after finding
    if (role !== 'admin') {
      const platformEnum = 'WHATSAPP' as any;
      const db = (this.userService as any).db;
      const record = await db.user.findUnique({
        where: { platform_platformUserId: { platform: platformEnum, platformUserId: phone } },
      });
      if (record) {
        await this.userService.setRole(record.id, role as any);
      }
    }

    return {
      success: true,
      message: `✅ User ${phone} role updated to *${role}*`,
    };
  }
}

export class SystemWipeCommand extends BaseCommandHandler {
  constructor(
    logger: ILogger,
    private sessionDir: string,
  ) {
    super(logger);
  }

  getName() { return 'system-wipe-sessions'; }
  getDescription() { return 'Emergency wipe of all WhatsApp session keys and terminate process'; }
  getCategory() { return 'admin'; }
  getRequiredRole() { return 'admin' as const; }

  async execute(_context: CommandContext): Promise<CommandResult> {
    this.logger.warn('EMERGENCY SYSTEM WIPE TRIGGERED BY ADMIN');

    const { rmSync } = await import('node:fs');

    setTimeout(() => {
      try {
        this.logger.warn(`Wiping session directory: ${this.sessionDir}`);
        rmSync(this.sessionDir, { recursive: true, force: true });
        this.logger.warn('Wipe complete. Terminating process.');
        process.exit(1);
      } catch (err) {
        this.logger.error('Error during emergency session wipe', err as Error);
        process.exit(1);
      }
    }, 2000);

    return {
      success: true,
      message: '🚨 *EMERGENCY SYSTEM WIPE:* WhatsApp sessions directory is being wiped. Bot process will terminate in 2 seconds.',
    };
  }
}

