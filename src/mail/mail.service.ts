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
            'http://localhost:3001/track'
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
        recipientName?: string,
    ) {
        const trackingUrl = `${this.trackingBaseUrl}/${trackingCode}`;

        return this.mailer.sendMail({
            to: email,
            subject: `Encomenda registrada — Código ${trackingCode}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                    <h2 style="color:#1d4ed8">Encomenda registrada com sucesso!</h2>
                    ${recipientName ? `<p>Olá, <b>${recipientName}</b>!</p>` : ''}
                    <p>Sua encomenda foi criada e já está sendo processada.</p>
                    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:0;font-size:13px;color:#64748b">Código de rastreio</p>
                        <p style="margin:4px 0;font-size:22px;font-weight:bold;letter-spacing:2px">${trackingCode}</p>
                    </div>
                    <p>Acompanhe o andamento da sua entrega em tempo real:</p>
                    <a href="${trackingUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
                        Rastrear encomenda
                    </a>
                    <p style="margin-top:24px;font-size:12px;color:#94a3b8">
                        Ou acesse diretamente: ${trackingUrl}
                    </p>
                </div>
            `,
        });
    }

    async sendShipmentDelivered(
        email: string,
        trackingCode: string,
        recipientName?: string,
    ) {
        const trackingUrl = `${this.trackingBaseUrl}/${trackingCode}`;

        return this.mailer.sendMail({
            to: email,
            subject: `Encomenda entregue — Código ${trackingCode}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                    <h2 style="color:#16a34a">Sua encomenda foi entregue!</h2>
                    ${recipientName ? `<p>Olá, <b>${recipientName}</b>!</p>` : ''}
                    <p>A entrega do seu pedido foi concluída com sucesso.</p>
                    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:0;font-size:13px;color:#64748b">Código de rastreio</p>
                        <p style="margin:4px 0;font-size:22px;font-weight:bold;letter-spacing:2px">${trackingCode}</p>
                    </div>
                    <a href="${trackingUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
                        Ver histórico de rastreio
                    </a>
                </div>
            `,
        });
    }
}
