import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const simpleParser = require('mailparser').simpleParser;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Imap = require('node-imap');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Base64Decode } = require('base64-stream');
import { v4 as uuidv4 } from 'uuid';

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
    message_id: null,
    send_at: null,
    receivers: {
      create: undefined,
    },
    files: {
      create: undefined,
    },
  };
  private imap;
  private results;
  @Interval(30000)
  async fetchMailViaImap() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias

    const clients = await this.prisma.client.findMany();

    for (const client of clients) {
      // console.log(client);
      await this.imapClient(client);
      await this.imap.once('ready', this.execute.bind(this));
      await this.imap.connect();
    }
  }

  private async imapClient(client) {
    this.imap = new Imap({
      user: client.email,
      password: client.password,
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT,
      tls: true,
      debug: console.log,
    });
    this.imap.once('error', (err) => {
      console.log(err);
    });
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
        self.results = results;

        const f = self.imap.fetch(results, {
          bodies: '',
          struct: true,
        });
        f.on('message', self.processMessage.bind(self));
        f.once('error', (err) => {
          throw err;
        });
        f.once('end', () => {
          console.log('imap ended ...');
          self.imap.end();
        });
      });
    });
  }

  private processMessage(msg, seqno) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const receivers = { create: [] };
    msg.once('body', (stream, info) => {
      simpleParser(stream, (err, mail) => {
        console.log('first itterate');

        self.email_params.from_email = mail.from.value[0].address;
        self.email_params.subject = mail.subject;
        self.email_params.text = mail.text;
        self.email_params.body = mail.html;
        self.email_params.message_id = mail.messageId.substring(
          mail.messageId.indexOf('<') + 1,
          mail.messageId.lastIndexOf('>'),
        );
        self.email_params.send_at = mail.date;

        if (mail.to !== undefined) {
          for (const to_email of mail.to.value) {
            receivers.create.push({
              type: 'TO',
              to_email: to_email.address,
            });
          }
        }

        if (mail.cc !== undefined) {
          for (const cc_email of mail.cc.value) {
            receivers.create.push({
              type: 'CC',
              to_email: cc_email.address,
            });
          }
        }
        if (mail.bcc !== undefined) {
          for (const bcc_email of mail.bcc.value) {
            receivers.create.push({
              type: 'BCC',
              to_email: bcc_email.address,
            });
          }
        }
        self.email_params.receivers = receivers;
      });
    });
    if (self.email_params.from_email !== null) {
      msg.once('attributes', (attr) => {
        const attachments = self.findAttachmentParts(attr.struct);
        // console.log(attachments);
        if (attachments.length !== 0) {
          console.log('Has attachments: %d', attachments.length);
          // console.log(attr);
          const files = { create: [] };
          for (const attachment of attachments) {
            const f = self.imap.fetch(attr.uid, {
              bodies: [attachment.partID],
              struct: true,
            });

            const filetitle = attachment.params.name;
            const filename = uuidv4() + '_' + filetitle;
            const encoding = attachment.encoding;

            files.create.push({
              title: filetitle,
              name: filename,
            });
            f.on('message', (msg, seqno) => {
              const prefix = '(#' + seqno + ') ';
              // console.log(prefix);
              msg.on('body', async (stream, info) => {
                console.log(
                  prefix + 'Streaming this attachment to file',
                  filetitle,
                  info,
                );

                const timeElapsed = Date.now();
                const today = new Date(timeElapsed);

                const year = today.getFullYear();
                const month = today.getMonth();
                const day = today.getDay();

                // console.log(year, mounth, day);
                const dir = path.join(
                  __dirname,
                  '../../attachments',
                  year.toString(),
                  month.toString(),
                  day.toString(),
                  seqno.toString(),
                );

                console.log(dir);

                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }

                const writeStream = fs.createWriteStream(
                  path.join(dir, filename),
                );

                writeStream.on('finish', function () {
                  console.log(prefix + 'Done writing to file %s', filename);
                });
                if (this.toUpper(encoding) === 'BASE64') {
                  //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
                  stream.pipe(new Base64Decode()).pipe(writeStream);
                } else {
                  //here we have none or some other decoding streamed directly to the file which renders it useless probably
                  stream.pipe(writeStream);
                }
              });
              msg.once('end', () => {
                console.log(prefix + 'Finished attachment %s', filename);
              });
            });
          }

          self.email_params.files = files;
        }
      });
    }
    msg.once('end', async () => {
      console.log(self.email_params);
      if (self.email_params.from_email !== null) {
        await self.imap.setFlags(self.results, ['Seen'], function (err) {
          if (!err) {
            console.log('marked as read');
          } else {
            console.log(JSON.stringify(err, null, 2));
          }
        });

        if (
          !(await self.prisma.mail.findUnique({
            where: {
              message_id: self.email_params.message_id,
            },
          }))
        ) {
          const data = {
            from_email: self.email_params.from_email,
            subject: self.email_params.subject,
            text: self.email_params.text,
            body: self.email_params.body,
            message_id: self.email_params.message_id,
            send_at: self.email_params.send_at,
            receivers: self.email_params.receivers,
            files: self.email_params.files,
          };
          await self.prisma.mail.create({
            data,
          });
        }

        self.email_params = {
          from_email: null,
          subject: null,
          text: null,
          body: null,
          message_id: null,
          send_at: null,
          receivers: {
            create: undefined,
          },
          files: {
            create: undefined,
          },
        };
      }

      console.log('message end ...');
    });
  }

  private toUpper(string: string) {
    return string && string.toUpperCase ? string.toUpperCase() : string;
  }

  private findAttachmentParts(struct, attachments = []) {
    attachments = attachments || [];
    const len = struct.length;
    for (let i = 0; i < len; ++i) {
      if (Array.isArray(struct[i])) {
        this.findAttachmentParts(struct[i], attachments);
      } else {
        if (
          struct[i].disposition &&
          ['INLINE', 'ATTACHMENT'].indexOf(
            this.toUpper(struct[i].disposition.type),
          ) > -1
        ) {
          attachments.push(struct[i]);
        }
      }
    }
    return attachments;
  }
}
