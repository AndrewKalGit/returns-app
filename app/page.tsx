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

  // Replace with your actual Google Apps Script Web App URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyG59PvmpZOo_bt6s19KTLJm7IlBWtGd6MosMNl0zG9UuN5MTyT3pURzCEY4ynjmI8FA/exec';

  const handleAddEntry = async () => {
    // Check if at least one identifier is provided
    if (!name.trim() && !lpn.trim() && !upcAsin.trim()) {
      setError('Please enter at least one: Name, LPN, or UPC/ASIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build query string based on what's provided
      const queryParams = new URLSearchParams();
      if (name.trim()) queryParams.append('name', name);
      if (lpn.trim()) queryParams.append('lpn', lpn);
      if (upcAsin.trim()) queryParams.append('upcasin', upcAsin);

      const response = await fetch(`${SCRIPT_URL}?${queryParams.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order data');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Use UPC/ASIN from input or from fetched data
      const finalAsin = upcAsin.trim() || data.upcAsin || 'N/A';

      // Generate SKU based on condition and ASIN
      const conditionCode = {
        'new': 'NEW',
        'used_like_new': 'ULN',
        'used_very_good': 'UVG',
        'used_good': 'UGD',
        'used_acceptable': 'UAC'
      }[condition];

      const sku = finalAsin !== 'N/A' ? `${finalAsin}-${conditionCode}` : 'N/A';

      // Create new entry with fetched data
      const newEntry: ReturnEntry = {
        sku: sku,
        asin: finalAsin,
        condition: condition.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
        quantity: qty,
        orderId: data.orderId || 'N/A',
        marketplace: data.marketplace || 'N/A',
        returnReason: data.returnReason || 'N/A',
        date: new Date().toLocaleDateString(),
        lpn: lpn.trim() || data.lpn || 'N/A',
        output: output,
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

  const downloadAsExcel = () => {
    // Create CSV content (Excel can open CSV files)
    const headers = ['SKU', 'ASIN', 'Condition', 'Quantity', 'Order ID', 'Marketplace', 'Return Reason', 'Date', 'LPN', 'Output'];
    const rows = returnEntries.map(entry => [
      entry.sku,
      entry.asin,
      entry.condition,
      entry.quantity,
      entry.orderId,
      entry.marketplace,
      entry.returnReason,
      entry.date,
      entry.lpn,
      entry.output
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

  const downloadAsTxt = () => {
    // Create tab-delimited content
    const headers = ['SKU', 'ASIN', 'Condition', 'Quantity', 'Order ID', 'Marketplace', 'Return Reason', 'Date', 'LPN', 'Output'];
    const rows = returnEntries.map(entry => [
      entry.sku,
      entry.asin,
      entry.condition,
      entry.quantity,
      entry.orderId,
      entry.marketplace,
      entry.returnReason,
      entry.date,
      entry.lpn,
      entry.output
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

  return (
    <main className="p-4 max-w-full">
      <h1 className="flex justify-center text-4xl font-semibold mt-2 mb-4">Returns Processing</h1>
      
      <div className="border-b border-gray-700 pb-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">LPN</label>
            <input 
              type="text" 
              value={lpn}
              onChange={(e) => setLpn(e.target.value)}
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
              className="w-full border border-gray-400 px-2 py-1 text-sm" 
              placeholder="UPC or ASIN"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
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
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Preview ({returnEntries.length} entries)</h2>
            <div className="flex gap-2">
              <button 
                onClick={downloadAsExcel}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Download CSV (Excel)
              </button>
              <button 
                onClick={downloadAsTxt}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Download TXT (Tab-Delimited)
              </button>
            </div>
          </div>

          <div className="overflow-auto border border-gray-300" style={{maxHeight: '600px'}}>
            <table className="min-w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">SKU</th>
                  <th className="border border-gray-300 px-2 py-1">ASIN</th>
                  <th className="border border-gray-300 px-2 py-1">Condition</th>
                  <th className="border border-gray-300 px-2 py-1">Qty</th>
                  <th className="border border-gray-300 px-2 py-1">Order ID</th>
                  <th className="border border-gray-300 px-2 py-1">Marketplace</th>
                  <th className="border border-gray-300 px-2 py-1">Return Reason</th>
                  <th className="border border-gray-300 px-2 py-1">Date</th>
                  <th className="border border-gray-300 px-2 py-1">LPN</th>
                  <th className="border border-gray-300 px-2 py-1">Output</th>
                  <th className="border border-gray-300 px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {returnEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1">{entry.sku}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.asin}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.condition}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{entry.quantity}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.orderId}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.marketplace}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.returnReason}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.date}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.lpn}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.output}</td>
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
      )}
    </main>
  );
}