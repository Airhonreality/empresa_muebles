export type CliFindingLevel = 'error' | 'warn' | 'info';

export type CliFinding = {
  level: CliFindingLevel;
  code: string;
  message: string;
  file?: string;
  line?: number;
  subject?: string;
  suggestion?: string;
  metadata?: Record<string, unknown>;
};

export type CliResult = {
  ok: boolean;
  command: string;
  summary: Record<string, unknown>;
  findings: CliFinding[];
  metadata?: Record<string, unknown>;
};

export type CliOutputOptions = {
  json?: boolean;
  quiet?: boolean;
};

export function createCliResult(params: {
  command: string;
  summary?: Record<string, unknown>;
  findings?: CliFinding[];
  metadata?: Record<string, unknown>;
}): CliResult {
  const findings = params.findings ?? [];
  return {
    ok: !findings.some(finding => finding.level === 'error'),
    command: params.command,
    summary: params.summary ?? {},
    findings,
    metadata: params.metadata,
  };
}

export function printCliResult(result: CliResult, options: CliOutputOptions = {}): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!options.quiet) {
    printHumanResult(result);
  }

  if (!result.ok) process.exitCode = 1;
}

function printHumanResult(result: CliResult): void {
  console.log(result.command);
  if (Object.keys(result.summary).length) {
    const summary = Object.entries(result.summary)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
    console.log(`Summary: ok=${result.ok} ${summary}`);
  } else {
    console.log(`Summary: ok=${result.ok}`);
  }

  for (const finding of result.findings) {
    const location = [
      finding.file,
      finding.subject,
      finding.line ? `line ${finding.line}` : null,
    ].filter(Boolean).join(':');
    console.log('');
    console.log(`[${finding.level}] ${finding.code}${location ? ` ${location}` : ''}`);
    console.log(`  ${finding.message}`);
    if (finding.suggestion) console.log(`  Fix: ${finding.suggestion}`);
    if (finding.metadata) {
      for (const [key, value] of Object.entries(finding.metadata)) {
        console.log(`  ${key}: ${String(value)}`);
      }
    }
  }
}
