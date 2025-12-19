// app/api/inventory/route.ts
import { NextResponse } from 'next/server';

// This would connect to your Google Sheets "webinv" sheet
// For now, returning mock data that matches your inventory structure

export async function GET() {
  try {
    // TODO: Replace with actual Google Sheets API call
    // const sheet = await getGoogleSheet('webinv');
    // const data = await sheet.getValues();
    
    const mockInventory = [
      {
        asin: 'B0726307618',
        sku: 'APP-4970-CR',
        productName: 'Pool Item #21',
        qty: 3,
        pendingQty: 1,
        totalQty: 4,
        location: 'C3',
        condition: 'UsedGood',
        inventoryPrice: 19.51,
        listingPrice: 13.66,
        dims: '25x12x5 in',
        weight: 4.6,
        lastReceived: '2025-04-10'
      },
      {
        asin: 'B0547441086',
        sku: 'POOL-8525-CR',
        productName: 'Pool Item #26',
        qty: 2,
        pendingQty: 1,
        totalQty: 3,
        location: 'C2',
        condition: 'UsedAcceptable',
        inventoryPrice: 72.65,
        listingPrice: 47.22,
        dims: '6x15x19 in',
        weight: 41.2,
        lastReceived: '2025-05-19'
      },
      {
        asin: 'B0216114544',
        sku: 'APP-1414-CR',
        productName: 'Pool Item #28',
        qty: 3,
        pendingQty: 1,
        totalQty: 4,
        location: 'C1',
        condition: 'UsedLikeNew',
        inventoryPrice: 72.81,
        listingPrice: 58.25,
        dims: '16x21x19 in',
        weight: 46.3,
        lastReceived: '2025-04-04'
      },
      {
        asin: 'B0921532526',
        sku: 'APP-1969-CR',
        productName: 'Pool Item #60',
        qty: 2,
        pendingQty: 1,
        totalQty: 3,
        location: 'C4',
        condition: 'UsedGood',
        inventoryPrice: 72.14,
        listingPrice: 50.50,
        dims: '29x15x20 in',
        weight: 7.1,
        lastReceived: '2025-04-04'
      },
      {
        asin: 'B0802754519',
        sku: 'POOL-4722-CR',
        productName: 'Pool Item #47',
        qty: 1,
        pendingQty: 1,
        totalQty: 2,
        location: 'D1',
        condition: 'UsedVeryGood',
        inventoryPrice: 19.91,
        listingPrice: 14.93,
        dims: '6x11x5 in',
        weight: 52.7,
        lastReceived: '2025-04-28'
      }
    ];

    return NextResponse.json(mockInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}