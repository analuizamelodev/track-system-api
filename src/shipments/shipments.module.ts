import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { MailModule } from 'src/mail/mail.module';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  imports: [MailModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, RolesGuard],
})
export class ShipmentsModule {}
