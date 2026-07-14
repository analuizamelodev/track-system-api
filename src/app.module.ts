import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ShipmentsModule } from './shipments/shipments.module';
import { CustomerModule } from './customers/customers.module';
import { SetupModule } from './setup/setup.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }), DatabaseModule, AuthModule, UsersModule, ShipmentsModule, CustomerModule, SetupModule, MailModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
