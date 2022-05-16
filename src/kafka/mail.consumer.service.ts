import { Injectable, OnModuleInit } from '@nestjs/common';
import { SmtpConsumerService } from '../smtp/smtp.consumer.service';
import { SmtpService } from '../smtp/smtp.service';

@Injectable()
export class MailConsumerService implements OnModuleInit {
  constructor(
    private readonly consumerService: SmtpConsumerService,
    private readonly smtpService: SmtpService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      { topics: ['smtp_request'] },
      {
        eachMessage: async ({ topic, partition, message }) => {
          const { token, directive, send, ...data } = JSON.parse(
            message.value.toString(),
          );
          await this.smtpService.createMail(token, data, send);
        },
      },
    );
  }
}
