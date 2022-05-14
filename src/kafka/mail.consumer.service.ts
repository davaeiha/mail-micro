import { Injectable, OnModuleInit } from '@nestjs/common';
import { SmtpConsumerService } from '../smtp/smtp.consumer.service';
import { SmtpService } from '../smtp/smtp.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PHPUnserialize = require('php-unserialize');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const encoding = require('encoding');

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
          const { directive, send, ...data } = JSON.parse(
            message.value.toString(),
          );
          await this.smtpService.createMail(data, send);
        },
      },
    );
  }
}
