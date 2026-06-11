import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() //TODO estudar o decorator @Global
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class DatabaseModule { }
