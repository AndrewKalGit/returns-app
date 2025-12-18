import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbylPZG1CIPKFo1FZPR1VtddM9CH_82lwnohU4i3zpMLvjxuWf11BcixB1dkpFm6lVXBEQ/exec';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');
  const lpn = searchParams.get('lpn');
  const upcasin = searchParams.get('upcasin');

  const queryParams = new URLSearchParams();
  if (name) queryParams.append('name', name);
  if (lpn) queryParams.append('lpn', lpn);
  if (upcasin) queryParams.append('upcasin', upcasin);

  try {
    const response = await fetch(`${SCRIPT_URL}?${queryParams.toString()}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Sheets returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Google Sheets' },
      { status: 500 }
    );
  }
}