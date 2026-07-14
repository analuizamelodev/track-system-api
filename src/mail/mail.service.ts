import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private readonly mailer: MailerService,
        private readonly config: ConfigService,
    ) { }

    private get trackingBaseUrl(): string {
        return (
            this.config.get<string>('TRACKING_BASE_URL') ??
            'http://localhost:3001/tracking'
        );
    }

    async sendWelcomeEmail(
        email: string,
        password: string,
    ) {
        return this.mailer.sendMail({
            to: email,
            subject: 'Bem-vindo ao Track System',
            html: `
        <h2>Bem-vindo!</h2>
        <p>Sua conta foi criada.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Senha temporária:</b> ${password}</p>
        <br>
        <p>Faça login e altere sua senha.</p>
      `,
        });
    }

    async sendShipmentCreated(
        email: string,
        trackingCode: string,
    ) {
        const trackingUrl = `${this.trackingBaseUrl}/${trackingCode}`;

        return this.mailer.sendMail({
            to: email,
            subject: 'Sua encomenda foi registrada',
            html: `
        <h2>Encomenda registrada</h2>
        <p>Sua encomenda foi criada com sucesso.</p>
        <p><b>Código de rastreio:</b> ${trackingCode}</p>
        <p>Acompanhe o andamento em:</p>
        <a href="${trackingUrl}">${trackingUrl}</a>
      `,
        });
    }

    async sendShipmentDelivered(
        email: string,
        trackingCode: string,
    ) {
        return this.mailer.sendMail({
            to: email,
            subject: 'Entrega concluída',
            html: `
        <h2>Sua encomenda foi entregue!</h2>
        <p>Código de rastreio:</p>
        <b>${trackingCode}</b>
      `,
        });
    }
}
