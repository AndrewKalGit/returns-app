// app/api/shipstation/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Ship Station API configuration
const SHIPSTATION_API_URL = 'https://ssapi.shipstation.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const apiSecret = searchParams.get('apiSecret');
    const orderId = searchParams.get('orderId');

    // If API credentials are not provided, fall back to Google Sheets mock data
    if (!apiKey || !apiSecret) {
      console.log('No Ship Station credentials, using Google Sheets fallback');
      return await getFromGoogleSheets(orderId);
    }

    // Ship Station API call
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch(`${SHIPSTATION_API_URL}/orders?orderNumber=${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ship Station API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Ship Station data to our format
    const transformedData = {
      orderId: data.orderNumber,
      orderDate: data.orderDate,
      shipDate: data.shipDate,
      carrier: data.carrierCode,
      service: data.serviceCode,
      trackingNumber: data.trackingNumber,
      location: data.advancedOptions?.warehouseId || 'N/A',
      marketplace: data.advancedOptions?.source || 'N/A',
      address: data.shipTo?.street1 || 'N/A',
      city: data.shipTo?.city || 'N/A',
      state: data.shipTo?.state || 'N/A',
      zip: data.shipTo?.postalCode || 'N/A',
      weight: data.weight?.value || 0
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching from Ship Station:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Ship Station, falling back to Google Sheets' },
      { status: 500 }
    );
  }
}

async function getFromGoogleSheets(orderId: string | null) {
  // Mock data from "shipments" sheet
  const mockShipments = [
    {
      orderId: '123-4567890-1000001',
      orderDate: '2025-04-29',
      shipDate: '2025-04-29',
      carrier: 'UPS',
      service: 'Ground',
      trackingNumber: 'TRK3083360',
      location: 'PA-WH02',
      marketplace: 'Bargain Ben',
      address: '854 Test St',
      city: 'Trenton',
      state: 'OH',
      zip: '08618',
      weight: 10.4
    },
    {
      orderId: '123-4567890-1000002',
      orderDate: '2025-04-02',
      shipDate: '2025-04-02',
      carrier: 'USPS',
      service: 'Priority',
      trackingNumber: 'TRK3240052',
      location: 'PA-WH02',
      marketplace: 'Amazon Renewed',
      address: '274 Test St',
      city: 'Trenton',
      state: 'PA',
      zip: '07102',
      weight: 33.3
    },
    {
      orderId: '123-4567890-1000003',
      orderDate: '2025-04-17',
      shipDate: '2025-04-18',
      carrier: 'FedEx',
      service: 'Home Delivery',
      trackingNumber: 'TRK6406717',
      location: 'OH-WH03',
      marketplace: 'Bargain Ben',
      address: '669 Test St',
      city: 'Trenton',
      state: 'OH',
      zip: '43215',
      weight: 30.1
    }
  ];

  const shipment = mockShipments.find(s => s.orderId === orderId);
  
  if (shipment) {
    return NextResponse.json(shipment);
  } else {
    return NextResponse.json(
      { error: 'Shipment record not found' },
      { status: 404 }
    );
  }
}

// POST endpoint for Ship Station webhooks (optional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Ship Station webhook events
    console.log('Ship Station webhook received:', body);
    
    // Process webhook data and update your system
    // This could trigger inventory updates when items are shipped
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Ship Station webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}