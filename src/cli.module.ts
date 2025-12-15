import { Module } from '@nestjs/common';
import { SHealthService } from './services/shealth.service';
import SamsungHealthCommand from './commands/shealth.cmd';

@Module({
  providers: [
    SHealthService,
    ...SamsungHealthCommand.registerWithSubCommands(),
  ],
})
export class CliModule {}
