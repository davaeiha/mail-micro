import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { MailProducerService } from '../kafka/mail.producer.service';
// import { mail as Mail } from '@prisma/client';
// import { ClientKafka } from '@nestjs/microservices';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');

@Injectable()
export class SmtpService {
  private mail;
  constructor(
    private prisma: PrismaService,
    private mailProducerService: MailProducerService,
  ) {}

  async createMail(token: string, data: Prisma.mailCreateInput, send = false) {
    this.mail = await this.prisma.mail.create({
      data,
      include: { receivers: true },
    });
    if (send) {
      await this.sendMailViaSmtp();
    }
    // console.log(JSON.stringify(this.mail));

    this.mail['token'] = token;

    await this.mailProducerService.produce({
      topic: 'smtp_response',
      messages: [
        {
          value: JSON.stringify(this.mail),
        },
      ],
    });

    // await this.mailProducerService.produce({
    //   topic: 'smtp_response',
    //   messages: [
    //     {
    //       value: JSON.stringify(this.mail),
    //     },
    //   ],
    // });
    return this.mail;
  }
  async sendDraftedMail(id: number) {
    this.mail = await this.prisma.mail.findUnique({
      where: {
        id,
      },
      include: {
        receivers: true,
      },
    });

    await this.sendMailViaSmtp();

    return this.mail;
  }
  async sendMailViaSmtp() {
    const client = await this.prisma.client.findUnique({
      where: {
        email: this.mail.from_email,
      },
    });

    const transporter = await nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: client.email,
        pass: client.password,
      },
    });
    const mailOptions = this.generateMailOptions();
    await transporter.sendMail(mailOptions);
    await this.generateSendAt();
  }

  private generateMailOptions() {
    const mailOptions = {
      from: `<${this.mail.from_email}>`,
      subject: this.mail.subject,
      text: this.mail.text,
      html: this.mail.body,
    };

    const to_emails = [];
    const cc_emails = [];
    const bcc_emails = [];

    for (const receiver of this.mail.receivers) {
      if (receiver['type'] == 'TO') {
        to_emails.push(receiver['to_email']);
      } else if (receiver['type'] == 'CC') {
        cc_emails.push(receiver['to_email']);
      } else if (receiver['type'] == 'BCC') {
        bcc_emails.push(receiver['to_email']);
      }
    }

    mailOptions['to'] = to_emails.join(', ');
    mailOptions['cc'] = cc_emails.join(', ');
    mailOptions['bcc'] = bcc_emails.join(', ');

    return mailOptions;
  }

  async generateSendAt() {
    const timeElapsed = Date.now();
    const date = new Date(timeElapsed);
    this.mail = await this.prisma.mail.update({
      where: {
        id: this.mail.id,
      },
      data: {
        send_at: date.toISOString(),
        updated_at: date.toISOString(),
      },
      include: {
        receivers: true,
      },
    });
  }
}
