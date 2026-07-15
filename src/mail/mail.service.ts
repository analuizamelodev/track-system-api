import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface CustomerFieldChange {
    label: string;
    oldValue: string;
    newValue: string;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

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

    private async send(to: string, subject: string, html: string): Promise<void> {
        await this.mailer.sendMail({ to, subject, html });
    }

    // ─── Operadores ──────────────────────────────────────────────────────────

    /**
     * Disparado quando o admin altera o NOME do operador.
     * Enviado para o e-mail atual (antigo) do operador.
     */
    async sendOperatorNameChanged(
        toEmail: string,
        oldName: string,
        newName: string,
    ): Promise<void> {
        this.logger.log(
            `[OperatorNameChanged] Notificando "${toEmail}" — "${oldName}" → "${newName}"`,
        );
        await this.send(
            toEmail,
            'Seu nome foi atualizado — TrackLog',
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">Nome atualizado</h2>
                <p>Olá! Um administrador atualizou o nome associado à sua conta.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0">
                    <table style="border-collapse:collapse;width:100%">
                        <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#6b7280;white-space:nowrap">Nome anterior</td>
                            <td style="padding:4px;font-size:14px;color:#111827">${oldName}</td>
                        </tr>
                        <tr>
                            <td style="padding:4px 8px 4px 0;font-size:13px;color:#16a34a;white-space:nowrap">Novo nome</td>
                            <td style="padding:4px;font-size:14px;font-weight:bold;color:#111827">${newName}</td>
                        </tr>
                    </table>
                </div>
                <p style="font-size:13px;color:#6b7280">
                    Se você não reconhece esta alteração, entre em contato com o administrador do sistema.
                </p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[OperatorNameChanged] Falha ao enviar para "${toEmail}": ${err?.message}`);
        });
    }

    /**
     * Disparado quando o admin altera o E-MAIL do operador.
     * Enviado SOMENTE para o NOVO endereço de e-mail.
     */
    async sendOperatorEmailChanged(
        toNewEmail: string,
        operatorName: string,
    ): Promise<void> {
        this.logger.log(
            `[OperatorEmailChanged] Notificando novo e-mail "${toNewEmail}" (operador: "${operatorName}")`,
        );
        await this.send(
            toNewEmail,
            'Seu e-mail de acesso foi atualizado — TrackLog',
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">E-mail de acesso atualizado</h2>
                <p>Olá, <b>${operatorName}</b>!</p>
                <p>Um administrador atualizou o endereço de e-mail da sua conta. A partir de agora, utilize este endereço para acessar o sistema:</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0">
                    <p style="margin:0 0 4px;font-size:13px;color:#16a34a">Novo e-mail</p>
                    <p style="margin:0;font-size:16px;font-weight:bold;color:#111827">${toNewEmail}</p>
                </div>
                <p style="font-size:13px;color:#6b7280">
                    Se você não solicitou esta alteração, entre em contato com o administrador do sistema imediatamente.
                </p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[OperatorEmailChanged] Falha ao enviar para "${toNewEmail}": ${err?.message}`);
        });
    }

    // ─── Clientes ─────────────────────────────────────────────────────────────

    /**
     * Disparado quando qualquer dado cadastral do cliente é alterado.
     * Recebe apenas os campos que realmente mudaram, com valor antigo e novo.
     * Enviado para o e-mail antigo do cliente (e também para o novo, se o e-mail mudou).
     */
    async sendCustomerDataUpdated(
        toEmail: string,
        customerName: string,
        changes: CustomerFieldChange[],
    ): Promise<void> {
        if (changes.length === 0) return;

        this.logger.log(
            `[CustomerDataUpdated] Notificando "${toEmail}" (${customerName}) — campos: ${changes.map((c) => c.label).join(', ')}`,
        );

        const rows = changes
            .map(
                (c) => `
                <tr>
                    <td style="padding:6px 12px 6px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top">${c.label}</td>
                    <td style="padding:6px 8px;font-size:13px;color:#374151;text-decoration:line-through;white-space:nowrap;vertical-align:top">${c.oldValue}</td>
                    <td style="padding:6px 0 6px 8px;font-size:13px;color:#111827;font-weight:bold;white-space:nowrap;vertical-align:top">→ ${c.newValue}</td>
                </tr>`,
            )
            .join('');

        await this.send(
            toEmail,
            'Seus dados foram atualizados — TrackLog',
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">Atualização de cadastro</h2>
                <p>Olá, <b>${customerName}</b>!</p>
                <p>As seguintes informações do seu cadastro foram atualizadas:</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;overflow-x:auto">
                    <table style="border-collapse:collapse;width:100%">
                        ${rows}
                    </table>
                </div>
                <p style="font-size:13px;color:#6b7280">
                    Se você não reconhece esta alteração, entre em contato com nossa equipe.
                </p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[CustomerDataUpdated] Falha ao enviar para "${toEmail}": ${err?.message}`);
        });
    }

    // ─── Usuários (sistema) ───────────────────────────────────────────────────

    async sendWelcomeEmail(email: string, password: string): Promise<void> {
        this.logger.log(`[WelcomeEmail] Enviando boas-vindas para "${email}"`);
        await this.send(
            email,
            'Bem-vindo ao Track System',
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">Bem-vindo ao TrackLog!</h2>
                <p>Sua conta foi criada. Use as credenciais abaixo para acessar o sistema:</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0">
                    <p style="margin:0 0 4px;font-size:13px;color:#16a34a">Email</p>
                    <p style="margin:0 0 12px;font-weight:bold;color:#111827">${email}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#16a34a">Senha temporária</p>
                    <p style="margin:0;font-weight:bold;letter-spacing:1px;color:#111827">${password}</p>
                </div>
                <p style="font-size:13px;color:#6b7280">Por segurança, altere sua senha no primeiro acesso.</p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[WelcomeEmail] Falha ao enviar para "${email}": ${err?.message}`);
        });
    }

    async sendPasswordReset(
        email: string,
        temporaryPassword: string,
        name?: string,
    ): Promise<void> {
        this.logger.log(`[PasswordReset] Enviando senha temporária para "${email}"`);
        await this.send(
            email,
            'Sua senha foi redefinida — TrackLog',
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">Senha redefinida com sucesso</h2>
                ${name ? `<p>Olá, <b>${name}</b>!</p>` : ''}
                <p>Uma nova senha temporária foi gerada para a sua conta. Use-a para fazer login e, em seguida, cadastre uma senha definitiva.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0">
                    <p style="margin:0 0 4px;font-size:13px;color:#16a34a">Nova senha temporária</p>
                    <p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:3px;color:#111827">${temporaryPassword}</p>
                </div>
                <p style="font-size:13px;color:#6b7280">Por segurança, você será solicitado a criar uma nova senha no primeiro acesso.</p>
                <p style="font-size:12px;color:#94a3b8;margin-top:24px">Se você não solicitou esta alteração, entre em contato com o administrador do sistema.</p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[PasswordReset] Falha ao enviar para "${email}": ${err?.message}`);
        });
    }

    // ─── Rastreio ─────────────────────────────────────────────────────────────

    async sendShipmentCreated(
        email: string,
        trackingCode: string,
        recipientName?: string,
    ): Promise<void> {
        const trackingUrl = `${this.trackingBaseUrl}/${trackingCode}`;
        this.logger.log(`[ShipmentCreated] Código ${trackingCode} → "${email}"`);
        await this.send(
            email,
            `Encomenda registrada — Código ${trackingCode}`,
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
                <h2 style="color:#15803d">Encomenda registrada com sucesso!</h2>
                ${recipientName ? `<p>Olá, <b>${recipientName}</b>!</p>` : ''}
                <p>Sua encomenda foi criada e já está sendo processada.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0">
                    <p style="margin:0;font-size:13px;color:#16a34a">Código de rastreio</p>
                    <p style="margin:4px 0;font-size:22px;font-weight:bold;letter-spacing:2px;color:#111827">${trackingCode}</p>
                </div>
                <p>Acompanhe o andamento da sua entrega em tempo real:</p>
                <a href="${trackingUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                    Rastrear encomenda
                </a>
                <p style="margin-top:24px;font-size:12px;color:#94a3b8">
                    Ou acesse diretamente: <a href="${trackingUrl}" style="color:#16a34a">${trackingUrl}</a>
                </p>
            </div>
            `,
        ).catch((err) => {
            this.logger.error(`[ShipmentCreated] Falha ao enviar para "${email}": ${err?.message}`);
        });
    }

    async sendShipmentDelivered(
        email: string,
        trackingCode: string,
        recipientName?: string,
    ): Promise<void> {
        const trackingUrl = `${this.trackingBaseUrl}/${trackingCode}`;
        this.logger.log(`[ShipmentDelivered] Código ${trackingCode} → "${email}"`);
        await this.send(
            email,
            `Encomenda entregue — Código ${trackingCode}`,
            `
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
        ).catch((err) => {
            this.logger.error(`[ShipmentDelivered] Falha ao enviar para "${email}": ${err?.message}`);
        });
    }
}
