import type { DataStrategy } from '@/core/types';
import { LocalStrategy } from './strategies/LocalStrategy';
import { GitHubStrategy } from './strategies/GitHubStrategy';

export function getStrategy(): DataStrategy {
  return process.env.GITHUB_TOKEN ? new GitHubStrategy() : new LocalStrategy();
}
