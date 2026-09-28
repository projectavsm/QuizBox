type LogMeta = Record<string, any>;

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function formatMeta(meta?: LogMeta): string {
  if (!meta || Object.keys(meta).length === 0) return '';
  return ` ${JSON.stringify(meta)}`;
}

function badge(label: string, color: string): string {
  return `${color}[${label}]${colors.reset}`;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.info(`${badge('INFO', colors.cyan)} ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(`${badge('WARN', colors.yellow)} ${message}${formatMeta(meta)}`);
  },
  error(message: string, error?: any) {
    const context = error instanceof Error ? error.message : error == null ? '' : String(error);
    console.error(`${badge('ERROR', colors.red)} ${message}${context ? `: ${context}` : ''}`);
  },
  action(actionName: string, summary: string) {
    console.info(`${badge('ACTION', colors.green)} ${actionName} -> ${summary}`);
  },
};