import { Module, CacheModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ImapService } from './imap.service';

@Module({
  imports: [ScheduleModule.forRoot(), CacheModule.register()],
  providers: [ImapService, PrismaService],
})
export class ImapModule {}
