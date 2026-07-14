import { ShipmentStatus } from 'src/enums/shipment-status.enum';

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
    [ShipmentStatus.ORDER_CREATED]:      'Pedido criado',
    [ShipmentStatus.IN_PREPARATION]:     'Em preparação',
    [ShipmentStatus.IN_TRANSIT]:         'Em trânsito',
    [ShipmentStatus.OUT_FOR_DELIVERY]:   'Saiu para entrega',
    [ShipmentStatus.DELIVERED]:          'Entregue',
    [ShipmentStatus.CANCELLED]:          'Cancelada',
    [ShipmentStatus.EXTRAVIADO]:         'Extraviado',
    [ShipmentStatus.DANIFICADO]:         'Danificado',
    [ShipmentStatus.ENDERECO_INVALIDO]:  'Endereço inválido',
    [ShipmentStatus.DESTINATARIO_AUSENTE]: 'Destinatário ausente',
};

/**
 * Máquina de estados para transições via PATCH /shipments/:id/status.
 *
 * CANCELLED e DELIVERED são estados especiais:
 *   - CANCELLED → exclusivamente via DELETE/PATCH /shipments/:id/cancel
 *   - DELIVERED → exclusivamente via PATCH /shipments/:id/finish  (valida CEP + assinatura)
 *
 * Qualquer tentativa de ir para esses dois estados pelo endpoint genérico
 * de status será bloqueada independentemente desta tabela.
 */
export const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    // Fluxo principal
    [ShipmentStatus.ORDER_CREATED]: [
        ShipmentStatus.IN_PREPARATION,
    ],
    [ShipmentStatus.IN_PREPARATION]: [
        ShipmentStatus.IN_TRANSIT,
    ],
    [ShipmentStatus.IN_TRANSIT]: [
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.EXTRAVIADO,
        ShipmentStatus.DANIFICADO,
        ShipmentStatus.ENDERECO_INVALIDO,
    ],
    [ShipmentStatus.OUT_FOR_DELIVERY]: [
        ShipmentStatus.DESTINATARIO_AUSENTE,
        ShipmentStatus.ENDERECO_INVALIDO,
        ShipmentStatus.DANIFICADO,
    ],

    // Estados finais — sem transições via /status
    [ShipmentStatus.DELIVERED]:  [],
    [ShipmentStatus.CANCELLED]:  [],

    // Estados de problema — com possibilidade de retomada
    [ShipmentStatus.EXTRAVIADO]: [
        ShipmentStatus.IN_TRANSIT,   // objeto localizado → retoma o transporte
    ],
    [ShipmentStatus.DANIFICADO]: [
        // sem retomada via /status; só encerra via /finish ou /cancel
    ],
    [ShipmentStatus.ENDERECO_INVALIDO]: [
        ShipmentStatus.IN_TRANSIT,   // endereço corrigido → retorna ao transporte
    ],
    [ShipmentStatus.DESTINATARIO_AUSENTE]: [
        ShipmentStatus.OUT_FOR_DELIVERY, // nova tentativa de entrega
    ],
};

/**
 * Status a partir dos quais é permitido cancelar via /cancel.
 * IN_TRANSIT e OUT_FOR_DELIVERY NÃO podem ser cancelados diretamente.
 */
const CANCELLABLE_FROM = new Set<ShipmentStatus>([
    ShipmentStatus.ORDER_CREATED,
    ShipmentStatus.IN_PREPARATION,
    ShipmentStatus.EXTRAVIADO,
    ShipmentStatus.DANIFICADO,
    ShipmentStatus.ENDERECO_INVALIDO,
    ShipmentStatus.DESTINATARIO_AUSENTE,
]);

/**
 * Status a partir dos quais é permitido finalizar (→ DELIVERED) via /finish.
 * Inclui DESTINATARIO_AUSENTE para o caso de entrega após tentativa anterior.
 */
const FINISHABLE_FROM = new Set<ShipmentStatus>([
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DANIFICADO,
    ShipmentStatus.DESTINATARIO_AUSENTE,
]);

/** Estados terminais — não aceitam nenhuma transição */
const TERMINAL_STATUSES = new Set<ShipmentStatus>([
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
]);

export function getShipmentStatusLabel(status: number): string {
    return STATUS_LABELS[status as ShipmentStatus] ?? 'Status desconhecido';
}

export function getAllowedTransitions(current: number): ShipmentStatus[] {
    return STATUS_TRANSITIONS[current as ShipmentStatus] ?? [];
}

export function isAllowedTransition(current: number, next: ShipmentStatus): boolean {
    return getAllowedTransitions(current).includes(next);
}

export function canCancel(status: number): boolean {
    return CANCELLABLE_FROM.has(status as ShipmentStatus);
}

export function canFinish(status: number): boolean {
    return FINISHABLE_FROM.has(status as ShipmentStatus);
}

export function isTerminal(status: number): boolean {
    return TERMINAL_STATUSES.has(status as ShipmentStatus);
}

export function normalizeCep(cep: string): string {
    return cep.replace(/\D/g, '');
}

export function formatCep(cep: string): string {
    const digits = normalizeCep(cep);
    return digits.length === 8
        ? `${digits.slice(0, 5)}-${digits.slice(5)}`
        : cep;
}

export function formatAddress(fields: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
}): string {
    return `${fields.street}, ${fields.number}, ${fields.neighborhood}, ${fields.city} - ${fields.state}, ${formatCep(fields.cep)}`;
}
