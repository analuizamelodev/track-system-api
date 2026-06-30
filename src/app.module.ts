import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ShipmentsModule } from './shipments/shipments.module';
import { CustomerModule } from './customers/customers.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }), DatabaseModule, AuthModule, UsersModule, ShipmentsModule, CustomerModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
