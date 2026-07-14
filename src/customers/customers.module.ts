import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerController } from './customers.controller';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  controllers: [CustomerController],
  providers: [CustomersService, RolesGuard],
})
export class CustomerModule { }
