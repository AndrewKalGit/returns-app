'use client'

import { useState } from 'react';

interface ReturnEntry {
  sku: string;
  asin: string;
  condition: string;
  quantity: number;
  orderId: string;
  marketplace: string;
  returnReason: string;
  date: string;
  lpn: string;
  output: string;
  inventoryPrice: number;
  listingPrice: number;
  productName: string;
}

export default function Home() {
  const [lpn, setLpn] = useState('');
  const [name, setName] = useState('');
  const [upcAsin, setUpcAsin] = useState('');
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState('new');
  const [output, setOutput] = useState('mfn');
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SCRIPT_URL = '/api/sheets';

  // Pricing formula based on condition (background calculation)
  const calculatePricing = (inventoryPrice: number, condition: string) => {
    const conditionMultipliers = {
      'new': 1.0,
      'used_like_new': 0.80,
      'used_very_good': 0.75,
      'used_good': 0.70,
      'used_acceptable': 0.65
    };
    
    const multiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 1.0;
    const listingPrice = inventoryPrice * multiplier;
    
    return {
      inventoryPrice: inventoryPrice,
      listingPrice: parseFloat(listingPrice.toFixed(2))
    };
  };

  const handleAddEntry = async () => {
    if (!name.trim() && !lpn.trim() && !upcAsin.trim()) {
      setError('Please enter at least one: Name, LPN, or UPC/ASIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (name.trim()) queryParams.append('name', name.trim());
      if (lpn.trim()) queryParams.append('lpn', lpn.trim());
      if (upcAsin.trim()) queryParams.append('upcasin', upcAsin.trim());

      const response = await fetch(`${SCRIPT_URL}?${queryParams.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Use data from Google Sheets or fallback to input
      const finalAsin = data.asin || upcAsin.trim() || 'N/A';
      const finalLpn = data.lpn || lpn.trim() || 'N/A';
      const finalProductName = data.productName || data.name || name.trim() || 'Unknown Product';
      
      const conditionCode = {
        'new': 'NEW',
        'used_like_new': 'ULN',
        'used_very_good': 'UVG',
        'used_good': 'UGD',
        'used_acceptable': 'UAC'
      }[condition];

      const sku = finalAsin !== 'N/A' ? `${finalAsin}-${conditionCode}` : 'N/A';

      // Get pricing from data or use defaults
      const baseInventoryPrice = parseFloat(data.inventoryPrice) || 25.00;
      const pricing = calculatePricing(baseInventoryPrice, condition);

      const newEntry: ReturnEntry = {
        sku: sku,
        asin: finalAsin,
        condition: condition.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
        quantity: qty,
        orderId: data.orderId || 'N/A',
        marketplace: data.marketplace || 'N/A',
        returnReason: data.returnReason || 'N/A',
        date: new Date().toLocaleDateString(),
        lpn: finalLpn,
        output: output,
        inventoryPrice: pricing.inventoryPrice,
        listingPrice: pricing.listingPrice,
        productName: finalProductName
      };

      setReturnEntries([...returnEntries, newEntry]);

      // Clear form inputs for next entry
      setLpn('');
      setName('');
      setUpcAsin('');
      setQty(1);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Error connecting to Google Sheets: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setReturnEntries([]);
  };

  const handleRemoveEntry = (index: number) => {
    setReturnEntries(returnEntries.filter((_, i) => i !== index));
  };

  const downloadReturnsCSV = () => {
    const headers = ['SKU', 'ASIN', 'Product Name', 'Condition', 'Quantity', 'Order ID', 'Marketplace', 'Return Reason', 'Date', 'LPN', 'Output', 'Inventory Price', 'Listing Price'];
    const rows = returnEntries.map(entry => [
      entry.sku,
      entry.asin,
      entry.productName,
      entry.condition,
      entry.quantity,
      entry.orderId,
      entry.marketplace,
      entry.returnReason,
      entry.date,
      entry.lpn,
      entry.output,
      entry.inventoryPrice.toFixed(2),
      entry.listingPrice.toFixed(2)
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `returns_upload_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadReturnsTXT = () => {
    const headers = ['SKU', 'ASIN', 'Product Name', 'Condition', 'Quantity', 'Order ID', 'Marketplace', 'Return Reason', 'Date', 'LPN', 'Output', 'Inventory Price', 'Listing Price'];
    const rows = returnEntries.map(entry => [
      entry.sku,
      entry.asin,
      entry.productName,
      entry.condition,
      entry.quantity,
      entry.orderId,
      entry.marketplace,
      entry.returnReason,
      entry.date,
      entry.lpn,
      entry.output,
      entry.inventoryPrice.toFixed(2),
      entry.listingPrice.toFixed(2)
    ]);

    let txtContent = headers.join('\t') + '\n';
    rows.forEach(row => {
      txtContent += row.join('\t') + '\n';
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `returns_upload_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const downloadInventoryCSV = () => {
    const headers = ['sku', 'product-id', 'product-id-type', 'price', 'item-condition', 'quantity', 'add-delete', 'will-ship-internationally', 'expedited-shipping', 'item-note', 'fulfillment-center-id'];
    
    const rows = returnEntries
      .filter(entry => entry.output === 'mfn' || entry.output === 'fba')
      .map(entry => [
        entry.sku,
        entry.asin,
        'ASIN',
        entry.listingPrice.toFixed(2),
        entry.condition === 'New' ? '11' : 
        entry.condition === 'Used Like New' ? '1' :
        entry.condition === 'Used Very Good' ? '2' :
        entry.condition === 'Used Good' ? '3' :
        entry.condition === 'Used Acceptable' ? '4' : '11',
        entry.quantity,
        'a',
        'n',
        'n',
        '',
        entry.output === 'fba' ? 'DEFAULT' : ''
      ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `amazon_inventory_upload_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadInventoryTXT = () => {
    const headers = ['sku', 'product-id', 'product-id-type', 'price', 'item-condition', 'quantity', 'add-delete', 'will-ship-internationally', 'expedited-shipping', 'item-note', 'fulfillment-center-id'];
    
    const rows = returnEntries
      .filter(entry => entry.output === 'mfn' || entry.output === 'fba')
      .map(entry => [
        entry.sku,
        entry.asin,
        'ASIN',
        entry.listingPrice.toFixed(2),
        entry.condition === 'New' ? '11' : 
        entry.condition === 'Used Like New' ? '1' :
        entry.condition === 'Used Very Good' ? '2' :
        entry.condition === 'Used Good' ? '3' :
        entry.condition === 'Used Acceptable' ? '4' : '11',
        entry.quantity,
        'a',
        'n',
        'n',
        '',
        entry.output === 'fba' ? 'DEFAULT' : ''
      ]);

    let txtContent = headers.join('\t') + '\n';
    rows.forEach(row => {
      txtContent += row.join('\t') + '\n';
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `amazon_inventory_upload_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  // Filter entries by output destination
  const mfnFbaEntries = returnEntries.filter(entry => entry.output === 'mfn' || entry.output === 'fba');
  const ebayEntries = returnEntries.filter(entry => entry.output === 'eBay');
  const throwEntries = returnEntries.filter(entry => entry.output === 'throw');

  return (
    <main className="p-4 max-w-full">
      <h1 className="flex justify-center text-4xl font-semibold mt-2 mb-4">Returns Processing</h1>
      
      <div className="border-b border-gray-700 pb-4 mb-4">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">LPN</label>
            <input 
              type="text" 
              value={lpn}
              onChange={(e) => setLpn(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEntry()}
              className="w-full border border-gray-400 px-2 py-1 text-sm" 
              placeholder="LPN"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEntry()}
              className="w-full border border-gray-400 px-2 py-1 text-sm" 
              placeholder="Full Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">UPC or ASIN</label>
            <input 
              type="text" 
              value={upcAsin}
              onChange={(e) => setUpcAsin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEntry()}
              className="w-full border border-gray-400 px-2 py-1 text-sm" 
              placeholder="UPC or ASIN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input 
              type="number" 
              min="1" 
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
            >
              <option value="new">New</option>
              <option value="used_like_new">Used Like New</option>
              <option value="used_very_good">Used Very Good</option>
              <option value="used_good">Used Good</option>
              <option value="used_acceptable">Used Acceptable</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Output Destination</label>
            <select 
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
            >
              <option value="mfn">MFN</option>
              <option value="fba">FBA</option>
              <option value="eBay">eBay</option>
              <option value="throw">Throw Away</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            onClick={handleAddEntry}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded text-sm disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Add Entry'}
          </button>
          <button 
            onClick={handleClearAll}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded text-sm"
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="mt-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>

      {returnEntries.length > 0 && (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">All Returns Preview ({returnEntries.length} entries)</h2>
              <div className="flex gap-2">
                <button 
                  onClick={downloadReturnsCSV}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Download CSV
                </button>
                <button 
                  onClick={downloadReturnsTXT}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Download TXT
                </button>
              </div>
            </div>

            <div className="overflow-auto border border-gray-300" style={{maxHeight: '400px'}}>
              <table className="min-w-full text-xs">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1">SKU</th>
                    <th className="border border-gray-300 px-2 py-1">ASIN</th>
                    <th className="border border-gray-300 px-2 py-1">Product Name</th>
                    <th className="border border-gray-300 px-2 py-1">Condition</th>
                    <th className="border border-gray-300 px-2 py-1">Qty</th>
                    <th className="border border-gray-300 px-2 py-1">Order ID</th>
                    <th className="border border-gray-300 px-2 py-1">Marketplace</th>
                    <th className="border border-gray-300 px-2 py-1">Return Reason</th>
                    <th className="border border-gray-300 px-2 py-1">Date</th>
                    <th className="border border-gray-300 px-2 py-1">LPN</th>
                    <th className="border border-gray-300 px-2 py-1">Output</th>
                    <th className="border border-gray-300 px-2 py-1">Inv. Price</th>
                    <th className="border border-gray-300 px-2 py-1">List Price</th>
                    <th className="border border-gray-300 px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{entry.sku}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.asin}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.productName}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.condition}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{entry.quantity}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.orderId}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.marketplace}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.returnReason}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.date}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.lpn}</td>
                      <td className="border border-gray-300 px-2 py-1">{entry.output}</td>
                      <td className="border border-gray-300 px-2 py-1">${entry.inventoryPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1">${entry.listingPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <button 
                          onClick={() => handleRemoveEntry(index)}
                          className="bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {mfnFbaEntries.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Amazon Inventory Upload - MFN/FBA ({mfnFbaEntries.length} entries)</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={downloadInventoryCSV}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                  >
                    Download CSV
                  </button>
                  <button 
                    onClick={downloadInventoryTXT}
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
                  >
                    Download TXT
                  </button>
                </div>
              </div>

              <div className="overflow-auto border border-gray-300" style={{maxHeight: '400px'}}>
                <table className="min-w-full text-xs">
                  <thead className="bg-blue-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">sku</th>
                      <th className="border border-gray-300 px-2 py-1">product-id</th>
                      <th className="border border-gray-300 px-2 py-1">product-id-type</th>
                      <th className="border border-gray-300 px-2 py-1">price</th>
                      <th className="border border-gray-300 px-2 py-1">item-condition</th>
                      <th className="border border-gray-300 px-2 py-1">quantity</th>
                      <th className="border border-gray-300 px-2 py-1">add-delete</th>
                      <th className="border border-gray-300 px-2 py-1">fulfillment-center-id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mfnFbaEntries.map((entry, index) => {
                      const conditionCode = entry.condition === 'New' ? '11' : 
                        entry.condition === 'Used Like New' ? '1' :
                        entry.condition === 'Used Very Good' ? '2' :
                        entry.condition === 'Used Good' ? '3' :
                        entry.condition === 'Used Acceptable' ? '4' : '11';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{entry.sku}</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.asin}</td>
                          <td className="border border-gray-300 px-2 py-1">ASIN</td>
                          <td className="border border-gray-300 px-2 py-1">${entry.listingPrice.toFixed(2)}</td>
                          <td className="border border-gray-300 px-2 py-1">{conditionCode}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{entry.quantity}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">a</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.output === 'fba' ? 'DEFAULT' : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ebayEntries.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">eBay Listings ({ebayEntries.length} entries)</h2>
              </div>
              <div className="overflow-auto border border-gray-300" style={{maxHeight: '300px'}}>
                <table className="min-w-full text-xs">
                  <thead className="bg-yellow-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">SKU</th>
                      <th className="border border-gray-300 px-2 py-1">Product Name</th>
                      <th className="border border-gray-300 px-2 py-1">Condition</th>
                      <th className="border border-gray-300 px-2 py-1">Quantity</th>
                      <th className="border border-gray-300 px-2 py-1">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ebayEntries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1">{entry.sku}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.productName}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.condition}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{entry.quantity}</td>
                        <td className="border border-gray-300 px-2 py-1">${entry.listingPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {throwEntries.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Disposal List ({throwEntries.length} entries)</h2>
              </div>
              <div className="overflow-auto border border-gray-300" style={{maxHeight: '300px'}}>
                <table className="min-w-full text-xs">
                  <thead className="bg-red-100 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">SKU</th>
                      <th className="border border-gray-300 px-2 py-1">Product Name</th>
                      <th className="border border-gray-300 px-2 py-1">Condition</th>
                      <th className="border border-gray-300 px-2 py-1">Quantity</th>
                      <th className="border border-gray-300 px-2 py-1">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {throwEntries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1">{entry.sku}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.productName}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.condition}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{entry.quantity}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.returnReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}