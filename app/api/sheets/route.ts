import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwVFfip1d33VUYl1jRB8AtHuK7QeGz9aWasaOIU4s_ViMxfSAsmBSpbywe-rZ10vycBg/exec';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');
  const lpn = searchParams.get('lpn');
  const upcasin = searchParams.get('upcasin');
  const orderId = searchParams.get('orderId');
  const action = searchParams.get('action');

  const queryParams = new URLSearchParams();
  if (name) queryParams.append('name', name);
  if (lpn) queryParams.append('lpn', lpn);
  if (upcasin) queryParams.append('upcasin', upcasin);
  if (orderId) queryParams.append('orderId', orderId);
  if (action) queryParams.append('action', action);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    console.error('Error posting to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Google Sheets' },
      { status: 500 }
    );
  }
}