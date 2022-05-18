import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PrismaClient } from '@prisma/client';
import { mail } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MailParser = require('mailparser').MailParser;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Imap = require('node-imap');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const inspect = require('util').inspect;

@Injectable()
export class ImapService {
  constructor(
    private readonly prisma: PrismaService, // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private email_params: Prisma.mailCreateInput = {
    from_email: null,
    subject: null,
    text: null,
    body: null,
    send_at: null,
    receivers: {
      create: undefined,
    },
  };
  private mails = [];
  private imap;
  @Interval(5000)
  async fetchMailViaImap() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias

    const clients = await this.prisma.client.findMany();

    for await (const client of clients) {
      this.imap = await new Imap({
        user: client.email,
        password: client.password,
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT,
        tls: true,
      });

      this.imap.once('ready', this.execute.bind(this));

      this.imap.once('error', (err) => {
        console.log(err);
      });

      this.imap.connect();
    }
  }

  private async execute() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    self.imap.openBox('INBOX', false, (err, mailBox) => {
      if (err) {
        throw err;
      }
      self.imap.search(['UNSEEN'], (err, results) => {
        if (!results || !results.length) {
          self.imap.end();
          return;
        }
        /* mark as seen
            this.imap.setFlags(results, ['\\Seen'], function(err) {
                if (!err) {
                    console.log("marked as read");
                } else {
                    console.log(JSON.stringify(err, null, 2));
                }
            });*/
        // return console.log(results);
        const f = self.imap.fetch(results, { bodies: '', struct: true });
        f.on('message', self.processMessage.bind(self));
        f.once('error', (err) => {
          throw err;
        });
        f.once('end', () => {
          self.imap.end();
          // console.log(self.mails);
        });
      });
    });
  }

  private async processMessage(msg, seqno) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // const email_params: Prisma.mailCreateInput = {
    //   from_email: null,
    //   subject: null,
    //   text: null,
    //   body: null,
    //   send_at: null,
    //   receivers: {
    //     create: undefined,
    //   },
    // };

    const parser = new MailParser();

    parser.on('headers', function (headers) {
      self.email_params['subject'] = headers.get('subject');
      self.email_params['send_at'] = headers.get('date');
      // console.log(headers.get('message'));

      if (headers.get('from') != undefined) {
        self.email_params['from_email'] = headers.get('from').value[0].address;
      }
      const receivers = { create: [] };
      if (headers.get('to') != undefined) {
        receivers.create.push({
          type: 'TO',
          to_email: headers.get('to').value[0].address,
        });
      }
      if (headers.get('cc') != undefined) {
        receivers.create.push({
          type: 'CC',
          to_email: headers.get('cc').value[0].address,
        });
      }
      if (headers.get('bcc') != undefined) {
        receivers.create.push({
          type: 'BCC',
          to_email: headers.get('bcc').value[0].address,
        });
      }
      self.email_params['receivers'] = receivers;
    });

    parser.on('data', async (data) => {
      if (data.type === 'text') {
        self.email_params['text'] = data.text;
        self.email_params['body'] = data.html;
      }
      if (data.type === 'attachment') {
        // await this.cacheManager.set('key', );
        data.content.pipe(process.stdout);
        data.content.on('end', () => data.release());
      }
      // console.log(self.email_params);
      // self.mails.push(self.email_params);
      // await self.prisma.mail.create({
      //   data: self.email_params,
      //   include: {
      //     receivers: true,
      //   },
      // });
    });

    msg.on('body', async function (stream) {
      stream.on('data', function (chunk) {
        parser.write(chunk.toString('utf8'));
      });
    });
    msg.once('attributes', function (attrs) {
      // console.log('Attributes: %s', inspect(attrs, false, 8));
      console.log(attrs);
    });

    msg.once('end', async () => {
      parser.end();
      // console.log(self.mails);
    });
  }
}
