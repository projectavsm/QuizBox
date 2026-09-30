import { NextResponse } from 'next/server';

interface LoginBody {
  password?: unknown;
}

export async function POST(request: Request) {
  let body: LoginBody = {};

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
  }

  const expectedPassword = process.env.QUIZBOX_ADMIN_SECRET || 'QuizBox@2026#AdminKey';
  const password = typeof body.password === 'string' ? body.password : '';

  if (password !== expectedPassword) {
    return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('quizbox_admin_auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 28800,
  });

  return response;
}