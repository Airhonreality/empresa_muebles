import { AuthStrategy, AuthUser } from './AuthStrategy';
import { isLegacyPasswordMatch, verifyPassword } from './password';

export class EmailPasswordStrategy implements AuthStrategy {
  constructor(private readonly getUsers: () => any[]) {}

  async authenticate(credentials: Record<string, unknown>): Promise<AuthUser | null> {
    const { email, password } = credentials as { email: string; password: string };
    const users = this.getUsers();
    let found: any = null;
    let passwordScheme: 'hash' | 'legacy' = 'hash';
    for (const user of users) {
      if (user.data?.email !== email) continue;
      const hashMatch = await verifyPassword(password, user.data?.password_hash);
      const legacyMatch = !hashMatch && isLegacyPasswordMatch(password, user.data?.password);
      if (hashMatch || legacyMatch) {
        found = user;
        passwordScheme = legacyMatch ? 'legacy' : 'hash';
        break;
      }
    }
    if (!found) return null;

    const type: string[] = (found.data?.type as string[]) ?? [];
    const role = type.includes('admin') ? 'admin' : (type[0] ?? 'viewer');

    return {
      id: found.id,
      email: found.data.email as string,
      name: (found.data.name as string) ?? email,
      role,
      metadata: { type, password_scheme: passwordScheme, needs_password_rehash: passwordScheme === 'legacy' },
    };
  }
}
