import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerController } from './customers.controller';
import { RolesGuard } from 'src/auth/roles.guard';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [CustomerController],
  providers: [CustomersService, RolesGuard],
})
export class CustomerModule { }
