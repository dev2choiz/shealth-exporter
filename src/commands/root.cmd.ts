import { CommandRunner, RootCommand } from 'nest-commander';
import SamsungHealthCommand from './shealth.cmd';

@RootCommand({
  description: 'root command, do nothing',
  subCommands: [SamsungHealthCommand],
})
class AppRootCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('root');
  }
}

export default AppRootCommand;
