import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'No token provided' }, { status: 400 });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secretKey) {
    return NextResponse.json(
      { success: false, message: 'Server captcha configuration is missing (RECAPTCHA_SECRET_KEY).' },
      { status: 500 }
    );
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  let data: { success?: boolean };
  try {
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    data = await verifyRes.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Could not reach Google reCAPTCHA verification service.' },
      { status: 502 }
    );
  }

  if (data.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, message: 'reCAPTCHA verification failed' }, { status: 400 });
  }
}
