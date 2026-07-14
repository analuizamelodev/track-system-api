import { ShipmentStatus } from 'src/enums/shipment-status.enum';

const STATUS_LABELS: Record<ShipmentStatus, string> = {
    [ShipmentStatus.ORDER_CREATED]: 'Pedido criado',
    [ShipmentStatus.IN_PREPARATION]: 'Em preparação',
    [ShipmentStatus.IN_TRANSIT]: 'Em trânsito',
    [ShipmentStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
    [ShipmentStatus.DELIVERED]: 'Entregue',
    [ShipmentStatus.CANCELLED]: 'Cancelada',
};

export function getShipmentStatusLabel(status: number): string {
    return STATUS_LABELS[status as ShipmentStatus] ?? 'Status desconhecido';
}
