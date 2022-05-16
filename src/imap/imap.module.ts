import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ImapService } from './imap.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ImapService, PrismaService],
})
export class ImapModule {}
