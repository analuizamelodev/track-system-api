import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) throw new UnauthorizedException();

        let payload: { sub: string; email: string; name: string; role: number };

        try {
            payload = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException();
        }

        // Verifica se o usuário ainda está ativo no banco a cada requisição
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { active: true },
        });

        if (!user || !user.active) {
            throw new UnauthorizedException('Usuário desativado');
        }

        request['user'] = payload;
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}