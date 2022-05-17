import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PrismaClient } from '@prisma/client';
import { mail } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MailParser = require('mailparser').MailParser;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Imap = require('node-imap');
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const prisma = require('../prisma.service');

@Injectable()
export class ImapService {
  private email_params: Prisma.mailCreateInput[];
  constructor(private readonly prisma: PrismaService) {}

  @Interval(10000)
  async fetchMailViaImap() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const clients = await this.prisma.client.findMany();

    for await (const client of clients) {
      const imap = await new Imap({
        user: client.email,
        password: client.password,
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT,
        tls: true,
      });

      imap.once('ready', execute);

      imap.once('error', function (err) {
        console.log(err);
      });

      imap.connect();

      function execute() {
        imap.openBox('INBOX', false, function (err, mailBox) {
          if (err) {
            throw err;
          }
          imap.search(['UNSEEN'], function (err, results) {
            if (!results || !results.length) {
              imap.end();
              return;
            }
            /* mark as seen
                imap.setFlags(results, ['\\Seen'], function(err) {
                    if (!err) {
                        console.log("marked as read");
                    } else {
                        console.log(JSON.stringify(err, null, 2));
                    }
                });*/
            // return console.log(results);
            const f = imap.fetch(results, { bodies: '' });
            f.on('message', processMessage);
            f.once('error', function (err) {
              throw err;
            });
            f.once('end', function () {
              imap.end();
            });

            function processMessage(msg, seqno) {
              const email_params: Prisma.mailCreateInput = {
                from_email: null,
                subject: null,
                text: null,
                body: null,
                send_at: null,
                receivers: {
                  create: undefined,
                },
              };

              const parser = new MailParser();

              parser.on('headers', function (headers) {
                email_params['subject'] = headers.get('subject');
                email_params['send_at'] = headers.get('date');

                if (headers.get('from') != undefined) {
                  email_params['from_email'] =
                    headers.get('from').value[0].address;
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
                email_params['receivers'] = receivers;
              });

              parser.on('data', async (data) => {
                if (data.type === 'text') {
                  email_params['text'] = data.text;
                  email_params['body'] = data.html;
                }
                if (data.type === 'attachment') {
                  data.content.pipe(process.stdout);
                  data.content.on('end', () => data.release());
                }

                await self.prisma.mail.create({
                  data: email_params,
                  include: {
                    receivers: true,
                  },
                });
              });

              msg.on('body', function (stream) {
                stream.on('data', function (chunk) {
                  parser.write(chunk.toString('utf8'));
                });
              });

              msg.once('end', () => {
                parser.end();
              });
            }
          });
        });
      }
    }
    console.log(1);
  }
}
