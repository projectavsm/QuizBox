import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [totalStudents, submissions] = await Promise.all([
    prisma.student.count(),
    prisma.submission.findMany({ include: { student: true }, orderBy: { submittedAt: 'desc' } }),
  ]);

  const percentages = submissions.map((submission) => submission.total > 0 ? (submission.score / submission.total) * 100 : 0);
  const averageScore = percentages.length ? percentages.reduce((sum, score) => sum + score, 0) / percentages.length : 0;
  const passRate = percentages.length ? (percentages.filter((score) => score > 50).length / percentages.length) * 100 : 0;

  return NextResponse.json({
    totalStudents,
    averageScore,
    passRate,
    results: submissions.map((submission, index) => ({
      id: submission.id,
      name: submission.student.name,
      gradeClass: submission.student.gradeClass,
      section: submission.student.section,
      rollNumber: submission.student.rollNumber,
      score: submission.score,
      total: submission.total,
      percentage: percentages[index],
      submittedAt: submission.submittedAt.toISOString(),
    })),
  });
}