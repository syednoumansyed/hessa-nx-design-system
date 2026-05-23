// Returns true if running in a development environment (web or native)
import { environment } from 'src/environments/environment';

export function isDevEnvironment(): boolean {
  return (
    environment.ENVIRONMENT_NAME === 'development' ||
    environment.ENVIRONMENT_NAME === 'local'
  );
}
