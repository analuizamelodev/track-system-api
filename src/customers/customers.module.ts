import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerController } from './customers.controller';

@Module({
  controllers: [CustomerController],
  providers: [CustomersService],
})
export class CustomerModule { }
