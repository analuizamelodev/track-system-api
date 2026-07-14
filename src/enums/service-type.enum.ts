export enum ServiceType {
    EXPRESS = 'EXPRESSO',
    STANDARD = 'PADRAO',
    ECONOMIC = 'ECONOMICO',
}

export const SERVICE_DELIVERY_DAYS: Record<ServiceType, number> = {
    [ServiceType.EXPRESS]: 3,
    [ServiceType.STANDARD]: 7,
    [ServiceType.ECONOMIC]: 14,
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
    [ServiceType.EXPRESS]: 'Expresso (até 3 dias úteis)',
    [ServiceType.STANDARD]: 'Padrão (até 7 dias úteis)',
    [ServiceType.ECONOMIC]: 'Econômico (até 14 dias úteis)',
};
