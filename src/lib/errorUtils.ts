import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export function handleServerError(error: unknown, actionName: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const messages: Record<string, string> = {
      P2002: 'A record with the same unique values already exists.',
      P2003: 'Missing foreign key relation.',
      P2025: 'The requested record could not be found.',
    };
    const message = messages[error.code] || 'A database request could not be completed.';
    logger.error(`[DB Error] [${actionName}] ${message} (${error.code})`);
    if (error.code === 'P2003' || error.code === 'P2025') return 'The requested record could not be found.';
    if (error.code === 'P2002') return 'A record with the same details already exists.';
    return 'A database error occurred. Please try again.';
  }

  logger.error(`[Server Error] [${actionName}] Unexpected failure`, error);
  return 'An unexpected error occurred. Please try again.';
}