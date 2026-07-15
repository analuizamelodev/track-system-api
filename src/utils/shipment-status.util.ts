import { ShipmentStatus } from 'src/enums/shipment-status.enum';

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
    [ShipmentStatus.ORDER_CREATED]:        'Pedido criado',
    [ShipmentStatus.IN_PREPARATION]:       'Em preparação',
    [ShipmentStatus.IN_TRANSIT]:           'Em trânsito',
    [ShipmentStatus.OUT_FOR_DELIVERY]:     'Saiu para entrega',
    [ShipmentStatus.DELIVERED]:            'Entregue',
    [ShipmentStatus.CANCELLED]:            'Cancelada',
    [ShipmentStatus.EXTRAVIADO]:           'Extraviado',
    [ShipmentStatus.DANIFICADO]:           'Danificado',
    [ShipmentStatus.ENDERECO_INVALIDO]:    'Endereço inválido',
    [ShipmentStatus.DESTINATARIO_AUSENTE]: 'Destinatário ausente',
};

// ---------------------------------------------------------------------------
// Máquina de estados — transições via PATCH /shipments/:id/status
//
// Regras especiais:
//  • CANCELLED  → exclusivamente via /shipments/:id/cancel
//  • DELIVERED  → exclusivamente via /shipments/:id/finish  (valida CEP + assinatura)
//  • IN_TRANSIT → pode repetir (cada evento registra uma nova localização)
// ---------------------------------------------------------------------------

export const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.ORDER_CREATED]: [
        ShipmentStatus.IN_PREPARATION,
    ],

    [ShipmentStatus.IN_PREPARATION]: [
        ShipmentStatus.IN_TRANSIT,
    ],

    [ShipmentStatus.IN_TRANSIT]: [
        ShipmentStatus.IN_TRANSIT,          // repetível — registra nova localização
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.EXTRAVIADO,
        ShipmentStatus.DANIFICADO,
        ShipmentStatus.ENDERECO_INVALIDO,
    ],

    [ShipmentStatus.OUT_FOR_DELIVERY]: [
        ShipmentStatus.DESTINATARIO_AUSENTE,
        ShipmentStatus.DANIFICADO,
        // DELIVERED somente via /finish
    ],

    // Estados finais
    [ShipmentStatus.DELIVERED]:  [],
    [ShipmentStatus.CANCELLED]:  [],

    // Ocorrências — sem retomada via /status; encerram somente via /cancel
    [ShipmentStatus.EXTRAVIADO]:           [],
    [ShipmentStatus.DANIFICADO]:           [],
    [ShipmentStatus.ENDERECO_INVALIDO]:    [],

    // Nova tentativa de entrega
    [ShipmentStatus.DESTINATARIO_AUSENTE]: [
        ShipmentStatus.OUT_FOR_DELIVERY,
        // CANCELLED somente via /cancel
    ],
};

// ---------------------------------------------------------------------------
// Campos obrigatórios por status — validados no service antes da transição
// ---------------------------------------------------------------------------

export const REQUIRED_FIELDS: Partial<Record<ShipmentStatus, Array<'location' | 'description'>>> = {
    [ShipmentStatus.IN_TRANSIT]:           ['location'],
    [ShipmentStatus.OUT_FOR_DELIVERY]:     ['location'],
    [ShipmentStatus.DESTINATARIO_AUSENTE]: ['description'],
    [ShipmentStatus.ENDERECO_INVALIDO]:    ['description'],
    [ShipmentStatus.DANIFICADO]:           ['description'],
    [ShipmentStatus.EXTRAVIADO]:           ['description'],
};

// ---------------------------------------------------------------------------
// Sets auxiliares para os endpoints dedicados
// ---------------------------------------------------------------------------

/** Cancelamento permitido via /cancel */
export const CANCELLABLE_FROM = new Set<ShipmentStatus>([
    ShipmentStatus.ORDER_CREATED,
    ShipmentStatus.IN_PREPARATION,
    ShipmentStatus.EXTRAVIADO,
    ShipmentStatus.DANIFICADO,
    ShipmentStatus.ENDERECO_INVALIDO,
    ShipmentStatus.DESTINATARIO_AUSENTE,
]);

/** Finalização (→ DELIVERED) permitida via /finish */
export const FINISHABLE_FROM = new Set<ShipmentStatus>([
    ShipmentStatus.OUT_FOR_DELIVERY,
]);

/** Estados que não aceitam nenhuma transição */
export const TERMINAL_STATUSES = new Set<ShipmentStatus>([
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
]);

// ---------------------------------------------------------------------------
// Funções utilitárias
// ---------------------------------------------------------------------------

export function getShipmentStatusLabel(status: number): string {
    return STATUS_LABELS[status as ShipmentStatus] ?? 'Status desconhecido';
}

export function getAllowedTransitions(current: number): ShipmentStatus[] {
    return STATUS_TRANSITIONS[current as ShipmentStatus] ?? [];
}

/**
 * Verifica se a transição `current → next` é permitida.
 * IN_TRANSIT → IN_TRANSIT é explicitamente permitido (repetível).
 */
export function isAllowedTransition(current: number, next: ShipmentStatus): boolean {
    return getAllowedTransitions(current).includes(next);
}

/** Campos obrigatórios para um dado status. */
export function getRequiredFields(
    status: ShipmentStatus,
): Array<'location' | 'description'> {
    return REQUIRED_FIELDS[status] ?? [];
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

// ---------------------------------------------------------------------------
// Helpers de endereço
// ---------------------------------------------------------------------------

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
    return (
        `${fields.street}, ${fields.number}, ` +
        `${fields.neighborhood}, ` +
        `${fields.city} - ${fields.state.toUpperCase()}, ` +
        formatCep(fields.cep)
    );
}
