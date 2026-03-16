import { Module } from '@nestjs/common';
import SamsungHealthCommand from './commands/shealth.cmd';
import { FileReaderService } from './services/file-reader.service';
import { LiveDataService } from './services/live-data.service';
import { SHealthService } from './services/shealth.service';

@Module({
  providers: [
    SHealthService,
    LiveDataService,
    FileReaderService,
    ...SamsungHealthCommand.registerWithSubCommands(),
  ],
})
export class CliModule {}
