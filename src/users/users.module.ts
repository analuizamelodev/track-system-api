import { Module } from '@nestjs/common';
import { UsersController } from './users-controller';
import { UsersService } from './users.service';
import { MailModule } from 'src/mail/mail.module';
import { RolesGuard } from 'src/auth/roles.guard';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule { }
