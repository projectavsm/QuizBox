import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const submissions = await prisma.submission.findMany({
    include: { student: true },
    orderBy: { submittedAt: 'desc' },
  });

  let csvContent = 'Roll Number,Name,Class,Section,Score,Total,Percentage,Submitted At\n';

  submissions.forEach((sub) => {
    const total = sub.total || 1;
    const percentage = ((sub.score / total) * 100).toFixed(2);
    const dateStr = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A';

    csvContent += `"${sub.student.rollNumber}","${sub.student.name}","${sub.student.gradeClass}","${sub.student.section}",${sub.score},${sub.total},${percentage}%,${dateStr}\n`;
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="quizbox_results.csv"',
    },
  });
}