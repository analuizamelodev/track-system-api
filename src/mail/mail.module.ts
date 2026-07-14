import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
    imports: [
        ConfigModule,

        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST'),
                    port: Number(config.get<number>('MAIL_PORT')),
                    secure: false,
                },

                defaults: {
                    from: config.get<string>('MAIL_FROM'),
                },
            }),
        }),
    ],

    providers: [MailService],
    controllers: [],
    exports: [MailService],
})
export class MailModule { }