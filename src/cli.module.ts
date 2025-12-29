import { Module } from '@nestjs/common';
import { SHealthService } from './services/shealth.service';
import SamsungHealthCommand from './commands/shealth.cmd';
import { LiveDataService } from './services/live-data.service';
import { FileReaderService } from './services/file-reader.service';

@Module({
  providers: [
    SHealthService,
    LiveDataService,
    FileReaderService,
    ...SamsungHealthCommand.registerWithSubCommands(),
  ],
})
export class CliModule {}
