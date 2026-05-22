import { Module } from '@nestjs/common';
import AppRootCommand from './commands/root.cmd';
import SamsungHealthCommand from './commands/shealth.cmd';
import { ConfigService } from './services/config.service';
import { FileReaderService } from './services/file-reader.service';
import { LiveDataService } from './services/live-data.service';
import { SHealthService } from './services/shealth.service';
import { TcxService } from './services/tcx.service';

@Module({
  providers: [
    ConfigService,
    SHealthService,
    TcxService,
    LiveDataService,
    FileReaderService,
    SHealthService,
    SamsungHealthCommand,
    ...AppRootCommand.registerWithSubCommands(),
  ],
})
export class CliModule {}
