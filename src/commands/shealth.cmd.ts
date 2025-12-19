import { SHealthService } from '../services/shealth.service';
import {
  CliUtilityService,
  CommandRunner,
  Option,
  RootCommand,
} from 'nest-commander';

const COMMAND_NAME = 'shealth-exporter';

type CommandOptions = {
  input: string;
  output: string;
  lastExercises: number;
};

@RootCommand({
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

  async run(_: string[], options?: CommandOptions): Promise<void> {
    if (!options?.input) throw new Error('--input path is required');
    if (!options?.output) throw new Error('--output path is required');

    try {
      return await this.shealthService.run(
        options.input,
        options.output,
        options.lastExercises,
      );
    } catch (err) {
      console.log(err instanceof Error ? err.message : err);
    }
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
    flags: '--lastExercises [lastExercises]',
    description: 'Export the last exercises (default=10)',
    required: false,
    defaultValue: -1,
  })
  parseLastExercises(val: string): number {
    return this.util.parseInt(val) || -1;
  }
}

export default SamsungHealthCommand;
