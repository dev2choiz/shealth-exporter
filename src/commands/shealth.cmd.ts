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
  lastExerciseOnly?: boolean;
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
        !!options.lastExerciseOnly,
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
    flags: '--lastExerciseOnly [lastExerciseOnly]',
    description: 'Export the last exercise only (default=true)',
    required: false,
    defaultValue: true,
  })
  parseLastExerciseOnly(val: string): boolean {
    return this.util.parseBoolean(val);
  }
}

export default SamsungHealthCommand;
