export function sanitizeUser<T extends { password?: string }>(
    user: T,
): Omit<T, 'password'> {
    const { password: _, ...safeUser } = user;
    return safeUser;
}

export function generateTemporaryPassword(): string {
    const chars =
        'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';

    for (let i = 0; i < 10; i++) {
        password += chars.charAt(
            Math.floor(Math.random() * chars.length),
        );
    }

    return password;
}
