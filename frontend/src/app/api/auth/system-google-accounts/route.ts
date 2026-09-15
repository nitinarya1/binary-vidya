import { NextResponse } from 'next/server';

export async function GET() {
  // On Vercel / production, return the verified primary developer account
  const accounts = [
    {
      name: 'Nitin Arya',
      email: 'aryar0779@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NitinArya&backgroundColor=38bdf8',
      googleId: '115102114215887463401',
    },
  ];

  return NextResponse.json({
    success: true,
    accounts,
  });
}
