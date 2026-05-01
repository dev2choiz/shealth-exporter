import {
  CliUtilityService,
  Command,
  CommandRunner,
  Option,
} from 'nest-commander';
import { SHealthService } from '../services/shealth.service';

const COMMAND_NAME = 'shealth-exporter';

type CommandOptions = {
  input: string;
  output: string;
  lastExercises?: number;
  configFile?: string;
};

@Command({
  name: COMMAND_NAME,
  description: 'Extract exercises data from Samsung Health export files',
})
class SamsungHealthCommand extends CommandRunner {
  constructor(
    protected readonly shealthService: SHealthService,
    protected readonly util: CliUtilityService,
  ) {
    super();
  }

  async run(_: string[], options: CommandOptions): Promise<void> {
    const config = await this.shealthService.getConfig(
      options.configFile,
      options.lastExercises,
    );

    return await this.shealthService.run(options.input, options.output, config);
  }

  @Option({
    flags: '-i, --input <input>',
    description: 'The samsung export folder path',
    required: true,
  })
  parseInput(val: string) {
    return val;
  }

  @Option({
    flags: '-o, --output <output>',
    description: 'Output folder path',
    required: true,
  })
  parseOutput(val: string) {
    return val;
  }

  @Option({
    flags: '--last-exercises [lastExercises]',
    description: 'Export the last exercises',
    required: false,
  })
  parseLastExercises(val: string): number {
    return this.util.parseInt(val);
  }

  @Option({
    flags: '--config-file [configFile]',
    description: 'A yaml file with the config',
    required: false,
  })
  parseConfigFile(val: string): string {
    return val;
  }
}

export default SamsungHealthCommand;
