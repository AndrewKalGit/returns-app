'use client'

import { useState, useEffect } from 'react';

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
  location?: string;
  locationNotes?: string;
  dims?: string;
  weight?: number;
}

interface InventoryItem {
  asin: string;
  sku: string;
  productName: string;
  qty: number;
  pendingQty: number;
  totalQty: number;
  location: string;
  locationNotes: string;
  condition: string;
  inventoryPrice: number;
  listingPrice: number;
  dims: string;
  weight: number;
  lastReceived: string;
}

interface OrderRecord {
  name: string;
  orderId: string;
  marketplace: string;
  returnReason: string;
  asin: string;
  lpn: string;
  date: string;
  address?: string;
  city?: string;
  state?: string;
  quantity?: number;
}

interface PendingUpload {
  sku: string;
  asin: string;
  productName: string;
  condition: string;
  quantity: number;
  marketplace: string;
  output: string;
  listingPrice: number;
  inventoryPrice: number;
  location: string;
  locationNotes: string;
}

export default function Home() {
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stagedOrders, setStagedOrders] = useState<OrderRecord[]>([]);
  const [stagedLPNs, setStagedLPNs] = useState<{date: string, lpn: string}[]>([]);
  const [stagedRemovals, setStagedRemovals] = useState<{date: string, asinUpc: string}[]>([]);
  const [nameSearchResults, setNameSearchResults] = useState<OrderRecord[]>([]);
  const [addressFilter, setAddressFilter] = useState('');
  const [orderLocationSearch, setOrderLocationSearch] = useState('');
  const [locationResult, setLocationResult] = useState('');
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  
  const [lpnInput, setLpnInput] = useState('');
  const [removalInput, setRemovalInput] = useState('');
  const [bulkNameInput, setBulkNameInput] = useState('');

  const SCRIPT_URL = '/api/sheets';

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

  const loadInventory = () => {
    const mockInventory: InventoryItem[] = [
      {
        asin: 'B0726307618',
        sku: 'APP-4970-CR',
        productName: 'Pool Item #21',
        qty: 3,
        pendingQty: 1,
        totalQty: 4,
        location: 'C3',
        locationNotes: 'near the rack',
        condition: 'UsedGood',
        inventoryPrice: 19.51,
        listingPrice: 19.51 * 0.70,
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
        locationNotes: 'near the ebay rack',
        condition: 'UsedAcceptable',
        inventoryPrice: 72.65,
        listingPrice: 72.65 * 0.65,
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
        locationNotes: 'near the front door',
        condition: 'UsedLikeNew',
        inventoryPrice: 72.81,
        listingPrice: 72.81 * 0.80,
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
        locationNotes: 'far back of bin',
        condition: 'UsedGood',
        inventoryPrice: 72.14,
        listingPrice: 72.14 * 0.70,
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
        locationNotes: 'burried deep',
        condition: 'UsedVeryGood',
        inventoryPrice: 19.91,
        listingPrice: 19.91 * 0.75,
        dims: '6x11x5 in',
        weight: 52.7,
        lastReceived: '2025-04-28'
      }
    ];
    setInventory(mockInventory);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSearchNames = () => {
    const names = bulkNameInput.split('\n').map(n => n.trim()).filter(n => n).slice(0, 25);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const mockResults: OrderRecord[] = [];
    names.forEach(searchName => {
      for (let i = 0; i < 10 && mockResults.length < 250; i++) {
        const orderDate = new Date(threeMonthsAgo.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);
        if (orderDate >= threeMonthsAgo) {
          mockResults.push({
            name: searchName,
            orderId: `123-456789${i}-000000${i}`,
            marketplace: ['Poolzilla', 'Bargain Ben', 'eBay'][Math.floor(Math.random() * 3)],
            returnReason: ['Changed Mind', 'Defective', 'Wrong Item'][Math.floor(Math.random() * 3)],
            asin: `B0${Math.random().toString().slice(2, 11)}`,
            lpn: `LPN${String(i).padStart(3, '0')}`,
            date: orderDate.toLocaleDateString(),
            address: `${Math.floor(Math.random() * 999)} Test St`,
            city: ['Trenton', 'Edison', 'Newark'][Math.floor(Math.random() * 3)],
            state: ['NJ', 'PA', 'OH'][Math.floor(Math.random() * 3)],
            quantity: 1
          });
        }
      }
    });
    
    setNameSearchResults(mockResults);
  };

  const addToStagedOrders = (order: OrderRecord) => {
    if (!stagedOrders.find(o => o.orderId === order.orderId)) {
      setStagedOrders([...stagedOrders, {...order, quantity: 1}]);
    }
  };

  const removeFromStagedOrders = (orderId: string) => {
    setStagedOrders(stagedOrders.filter(o => o.orderId !== orderId));
  };

  const updateStagedOrderQty = (orderId: string, newQty: number) => {
    setStagedOrders(stagedOrders.map(o => 
      o.orderId === orderId ? {...o, quantity: Math.max(0, newQty)} : o
    ));
  };

const addOrderItemsToPending = (order: OrderRecord) => {
    // Use existing inventory data or create a basic entry
    const existingItem = inventory.find(item => item.asin === order.asin);
    
    const asin = existingItem?.asin || order.asin;
    const productName = existingItem?.productName || 'Unknown Product';
    const condition = existingItem?.condition || 'UsedGood';
    const sku = existingItem?.sku || `${asin}-SKU`;
    const inventoryPrice = existingItem?.inventoryPrice || 25.00;
    const listingPrice = existingItem?.listingPrice || inventoryPrice * 0.70;
    const location = existingItem?.location || 'TBD';
    const locationNotes = existingItem?.locationNotes || '';

    const newPending: PendingUpload = {
      sku: sku,
      asin: asin,
      productName: productName,
      condition: condition,
      quantity: order.quantity || 1,
      marketplace: order.marketplace,
      output: order.marketplace === 'eBay' ? 'eBay' : 'MFN',
      listingPrice: listingPrice,
      inventoryPrice: inventoryPrice,
      location: location,
      locationNotes: locationNotes
    };
    
    // Use functional update to avoid stale state
    setPendingUploads(prev => [...prev, newPending]);
    
    // Update inventory if item exists - also use functional update
    if (existingItem) {
      const qtyToAdd = order.quantity || 1;
      setInventory(prev => prev.map(item => 
        item.asin === asin 
          ? {...item, pendingQty: item.pendingQty + qtyToAdd, totalQty: item.totalQty + qtyToAdd}
          : item
      ));
    }
  };
  const handlePopulateOrderLog = async () => {
    if (stagedOrders.length === 0) {
      alert('No staged orders to populate');
      return;
    }

    try {
      const response = await fetch(`${SCRIPT_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'populateMFN',
          orders: stagedOrders
        })
      });

      const data = await response.json();

     if (data.error) {
  alert(`Error: ${data.error}`);
} else {
  setStagedOrders([]);
}

    } catch (err) {
      console.error('Error populating MFN sheet:', err);
      alert('Error populating MFN sheet');
    }
  };

  const exportOrdersCSV = () => {
    const headers = ['Order ID', 'Marketplace', 'Quantity Returned', 'Return Reason', 'Date Received'];
    const rows = stagedOrders.map(order => [order.orderId, order.marketplace, order.quantity || 1, order.returnReason, order.date]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staged_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const addLPNToStage = () => {
    if (lpnInput.trim()) {
      setStagedLPNs([...stagedLPNs, { date: new Date().toLocaleDateString(), lpn: lpnInput.trim() }]);
      setLpnInput('');
    }
  };

  const removeStagedLPN = (index: number) => {
    setStagedLPNs(stagedLPNs.filter((_, i) => i !== index));
  };

  const addLPNToPending = async (lpnValue: string) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('lpn', lpnValue);
      queryParams.append('action', 'getLPNDetails');

      const response = await fetch(`${SCRIPT_URL}?${queryParams.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error fetching LPN details: ${data.error}`);
        return;
      }

      const asin = data.asin || 'N/A';
      const productName = data.productName || 'Unknown Product';
      const condition = data.condition || 'UsedGood';
      const sku = data.sku || `${asin}-SKU`;
      const inventoryPrice = parseFloat(data.inventoryPrice) || 25.00;
      const listingPrice = parseFloat(data.listingPrice) || inventoryPrice * 0.70;
      const location = data.location || 'TBD';
      const locationNotes = data.locationNotes || '';
      const marketplace = data.marketplace || 'Poolzilla';

      const newPending: PendingUpload = {
        sku: sku,
        asin: asin,
        productName: productName,
        condition: condition,
        quantity: 1,
        marketplace: marketplace,
        output: marketplace === 'eBay' ? 'eBay' : 'MFN',
        listingPrice: listingPrice,
        inventoryPrice: inventoryPrice,
        location: location,
        locationNotes: locationNotes
      };
      
      setPendingUploads([...pendingUploads, newPending]);
      
      const existingItem = inventory.find(item => item.asin === asin);
      if (existingItem) {
        const updatedInventory = inventory.map(item => 
          item.asin === asin 
            ? {...item, pendingQty: item.pendingQty + 1, totalQty: item.totalQty + 1}
            : item
        );
        setInventory(updatedInventory);
      }
      
    } catch (err) {
      console.error('Error adding LPN to pending:', err);
      alert('Error adding LPN to pending upload');
    }
  };

  const handlePopulateLPNLog = async () => {
    if (stagedLPNs.length === 0) {
      alert('No staged LPNs to populate');
      return;
    }

    try {
      const response = await fetch(`${SCRIPT_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'populateLPN',
          lpns: stagedLPNs
        })
      });

      const data = await response.json();

      if (data.error) {
  alert(`Error: ${data.error}`);
} else {
  setStagedLPNs([]);
}
    } catch (err) {
      console.error('Error populating LPN sheet:', err);
      alert('Error populating LPN sheet');
    }
  };

  const exportLPNsCSV = () => {
    const headers = ['Date', 'LPN'];
    const rows = stagedLPNs.map(item => [item.date, item.lpn]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staged_lpns_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const addRemovalToStage = () => {
    if (removalInput.trim()) {
      setStagedRemovals([...stagedRemovals, { date: new Date().toLocaleDateString(), asinUpc: removalInput.trim() }]);
      setRemovalInput('');
    }
  };

  const removeStagedRemoval = (index: number) => {
    setStagedRemovals(stagedRemovals.filter((_, i) => i !== index));
  };

  const addRemovalToPending = async (asinUpc: string) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('upcasin', asinUpc);

      const response = await fetch(`${SCRIPT_URL}?${queryParams.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error fetching removal details: ${data.error}`);
        return;
      }

      const asin = data.asin || asinUpc;
      const productName = data.productName || 'Unknown Product';
      const condition = data.condition || 'UsedGood';
      const sku = data.sku || `${asin}-SKU`;
      const inventoryPrice = parseFloat(data.inventoryPrice) || 25.00;
      const listingPrice = parseFloat(data.listingPrice) || inventoryPrice * 0.70;
      const location = data.location || 'TBD';
      const locationNotes = data.locationNotes || '';
      const marketplace = data.marketplace || 'Poolzilla';

      const newPending: PendingUpload = {
        sku: sku,
        asin: asin,
        productName: productName,
        condition: condition,
        quantity: 1,
        marketplace: marketplace,
        output: marketplace === 'eBay' ? 'eBay' : 'MFN',
        listingPrice: listingPrice,
        inventoryPrice: inventoryPrice,
        location: location,
        locationNotes: locationNotes
      };
      
      setPendingUploads([...pendingUploads, newPending]);
      
      const existingItem = inventory.find(item => item.asin === asin);
      if (existingItem) {
        const updatedInventory = inventory.map(item => 
          item.asin === asin 
            ? {...item, pendingQty: item.pendingQty + 1, totalQty: item.totalQty + 1}
            : item
        );
        setInventory(updatedInventory);
      }
    
    } catch (err) {
      console.error('Error adding removal to pending:', err);
      alert('Error adding removal to pending upload');
    }
  };

  const handlePopulateRemovalLog = async () => {
    if (stagedRemovals.length === 0) {
      alert('No staged removals to populate');
      return;
    }

    try {
      const response = await fetch(`${SCRIPT_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'populateRemoval',
          removals: stagedRemovals
        })
      });

      const data = await response.json();

     if (data.error) {
  alert(`Error: ${data.error}`);
} else {
  setStagedRemovals([]);
}
    } catch (err) {
      console.error('Error populating Removal sheet:', err);
      alert('Error populating Removal sheet');
    }
  };

  const exportRemovalsCSV = () => {
    const headers = ['Date', 'AsinUPC'];
    const rows = stagedRemovals.map(item => [item.date, item.asinUpc]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staged_removals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const searchOrderLocation = () => {
    const mockShipments = [
      { orderId: '123-4567890-1000001', location: 'PA-WH02' },
      { orderId: '123-4567890-1000002', location: 'PA-WH02' },
      { orderId: '123-4567890-1000003', location: 'OH-WH03' }
    ];
    
    const found = mockShipments.find(s => s.orderId === orderLocationSearch);
    setLocationResult(found ? `Location: ${found.location}` : 'Shipment record not found');
  };

  const updatePendingLocation = (index: number, location: string) => {
    const updated = [...pendingUploads];
    updated[index].location = location;
    setPendingUploads(updated);
  };

  const updatePendingLocationNotes = (index: number, notes: string) => {
    const updated = [...pendingUploads];
    updated[index].locationNotes = notes;
    setPendingUploads(updated);
  };

  const removePendingUpload = (index: number) => {
    const item = pendingUploads[index];
    const updatedInventory = inventory.map(inv => 
      inv.asin === item.asin 
        ? {...inv, pendingQty: Math.max(0, inv.pendingQty - item.quantity), totalQty: Math.max(0, inv.totalQty - item.quantity)}
        : inv
    );
    setInventory(updatedInventory);
    setPendingUploads(pendingUploads.filter((_, i) => i !== index));
  };

  const handleCreateUpload = () => {
    if (pendingUploads.length === 0) {
      alert('No items in pending upload');
      return;
    }

    const updatedInventory = inventory.map(item => {
      const pendingItem = pendingUploads.find(p => p.asin === item.asin);
      if (pendingItem) {
        return {
          ...item,
          qty: item.qty + pendingItem.quantity,
          pendingQty: Math.max(0, item.pendingQty - pendingItem.quantity)
        };
      }
      return item;
    });
    
    setInventory(updatedInventory);
  };

const downloadUpload = (type: string) => {
  const filtered = pendingUploads.filter(item => {
    if (type === 'ebay') return item.marketplace === 'eBay';
    if (type === 'poolzilla') return item.marketplace === 'Poolzilla';
    if (type === 'bargain') return item.marketplace === 'Bargain Ben';
    return false;
  });

  if (filtered.length === 0) {
    alert(`No items for ${type}`);
    return;
  }

  if (type === 'ebay') {
    const headers = ['SKU', 'ASIN', 'Product Name', 'Condition', 'Quantity', 'Price', 'Location', 'Notes'];
    const rows = filtered.map(item => [
      item.sku, item.asin, item.productName, item.condition, item.quantity,
      item.listingPrice.toFixed(2), item.location, item.locationNotes
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ebay_upload_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } else {
    const headers = ['sku', 'product-id', 'product-id-type', 'price', 'item-condition', 'quantity', 'add-delete', 'fulfillment-center-id'];
    const rows = filtered.map(item => {
      const conditionCode = item.condition === 'New' ? '11' : 
        item.condition === 'UsedLikeNew' ? '1' :
        item.condition === 'UsedVeryGood' ? '2' :
        item.condition === 'UsedGood' ? '3' : '4';
      
      return [
        item.sku, item.asin, 'ASIN', item.listingPrice.toFixed(2),
        conditionCode, item.quantity, 'a', ''
      ];
    });

    let txtContent = headers.join('\t') + '\n';
    rows.forEach(row => {
      txtContent += row.join('\t') + '\n';
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  }
};

 const downloadUploadExcel = (type: string) => {
  const filtered = pendingUploads.filter(item => {
    if (type === 'ebay') return item.marketplace === 'eBay';
    if (type === 'poolzilla') return item.marketplace === 'Poolzilla';
    if (type === 'bargain') return item.marketplace === 'Bargain Ben';
    return false;
  });

  if (filtered.length === 0) {
    alert(`No items for ${type}`);
    return;
  }

  const headers = type === 'ebay' 
    ? ['SKU', 'ASIN', 'Product Name', 'Condition', 'Quantity', 'Price', 'Location', 'Notes']
    : ['sku', 'product-id', 'product-id-type', 'price', 'item-condition', 'quantity', 'add-delete', 'fulfillment-center-id'];

  const rows = type === 'ebay'
    ? filtered.map(item => [item.sku, item.asin, item.productName, item.condition, item.quantity, item.listingPrice.toFixed(2), item.location, item.locationNotes])
    : filtered.map(item => {
        const conditionCode = item.condition === 'New' ? '11' : 
          item.condition === 'UsedLikeNew' ? '1' :
          item.condition === 'UsedVeryGood' ? '2' :
          item.condition === 'UsedGood' ? '3' : '4';
        return [item.sku, item.asin, 'ASIN', item.listingPrice.toFixed(2), conditionCode, item.quantity, 'a', ''];
      });

  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
  const handleClearAll = () => {
    setReturnEntries([]);
    setPendingUploads([]);
  };

  const addAllOrdersToPending = () => {
  if (stagedOrders.length === 0) {
    alert('No staged orders to add');
    return;
  }
  
  stagedOrders.forEach(order => {
    addOrderItemsToPending(order);
  });
};

const addAllLPNsToPending = async () => {
  if (stagedLPNs.length === 0) {
    alert('No staged LPNs to add');
    return;
  }
  
  for (const item of stagedLPNs) {
    await addLPNToPending(item.lpn);
  }
};

const addAllRemovalsToPending = async () => {
  if (stagedRemovals.length === 0) {
    alert('No staged removals to add');
    return;
  }
  
  for (const item of stagedRemovals) {
    await addRemovalToPending(item.asinUpc);
  }
};
  return (
    <main className="p-4 max-w-full">
      <h1 className="flex justify-center text-4xl font-semibold mt-2 mb-4">Returns Processing System</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-300 p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Today's Inventory Report: Pending Shipment, Pending Listing, + Current Inventory "Qty"</h2>
            <button 
              onClick={loadInventory}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
            >
              Refresh
            </button>
          </div>
          
          <div className="overflow-auto" style={{maxHeight: '400px'}}>
            <table className="min-w-full text-xs border border-gray-300">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">ASIN</th>
                  <th className="border border-gray-300 px-2 py-1">SKU</th>
                  <th className="border border-gray-300 px-2 py-1">Product</th>
                  <th className="border border-gray-300 px-2 py-1">Qty</th>
                  <th className="border border-gray-300 px-2 py-1">Pending</th>
                  <th className="border border-gray-300 px-2 py-1">Total</th>
                  <th className="border border-gray-300 px-2 py-1">Location</th>
                  <th className="border border-gray-300 px-2 py-1">Notes</th>
                  <th className="border border-gray-300 px-2 py-1">Price</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-2 py-1">{item.asin}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.sku}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.productName}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{item.qty}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold text-orange-600">{item.pendingQty}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold">{item.totalQty}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.location}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600">{item.locationNotes}</td>
                    <td className="border border-gray-300 px-2 py-1">${item.listingPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-gray-300 p-4 bg-yellow-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Pending Upload ({pendingUploads.length})</h2>
          </div>
          
          <div className="overflow-auto mb-3" style={{maxHeight: '280px'}}>
            <table className="min-w-full text-xs border border-gray-300">
             <thead className="bg-yellow-100 sticky top-0">
  <tr>
    <th className="border border-gray-300 px-2 py-1">SKU</th>
    <th className="border border-gray-300 px-2 py-1">ASIN</th>
    <th className="border border-gray-300 px-2 py-1">Product</th>
    <th className="border border-gray-300 px-2 py-1">Qty</th>
    <th className="border border-gray-300 px-2 py-1">Marketplace</th>
    <th className="border border-gray-300 px-2 py-1">Location</th>
    <th className="border border-gray-300 px-2 py-1">Notes</th>
    <th className="border border-gray-300 px-2 py-1">Action</th>
  </tr>
</thead>
<tbody>
  {pendingUploads.map((item, index) => (
    <tr key={index} className="hover:bg-yellow-100">
      <td className="border border-gray-300 px-2 py-1">{item.sku}</td>
      <td className="border border-gray-300 px-2 py-1">{item.asin}</td>
      <td className="border border-gray-300 px-2 py-1">{item.productName}</td>
      <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
      <td className="border border-gray-300 px-2 py-1">{item.marketplace}</td>
      <td className="border border-gray-300 px-1 py-1">
        <input
          type="text"
          value={item.location}
          onChange={(e) => updatePendingLocation(index, e.target.value)}
          className="w-full border border-gray-300 px-1 py-0.5 text-xs"
          placeholder="C4"
        />
      </td>
      <td className="border border-gray-300 px-1 py-1">
        <input
          type="text"
          value={item.locationNotes}
          onChange={(e) => updatePendingLocationNotes(index, e.target.value)}
          className="w-full border border-gray-300 px-1 py-0.5 text-xs"
          placeholder="notes"
        />
      </td>
      <td className="border border-gray-300 px-2 py-1 text-center">
        <button
          onClick={() => removePendingUpload(index)}
          className="bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
        >
          Remove
        </button>
      </td>
    </tr>
  ))}
</tbody>
              <tbody>
                {pendingUploads.map((item, index) => (
                  <tr key={index} className="hover:bg-yellow-100">
                    <td className="border border-gray-300 px-2 py-1">{item.sku}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.productName}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.marketplace}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.output}</td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => updatePendingLocation(index, e.target.value)}
                        className="w-full border border-gray-300 px-1 py-0.5 text-xs"
                        placeholder="C4"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={item.locationNotes}
                        onChange={(e) => updatePendingLocationNotes(index, e.target.value)}
                        className="w-full border border-gray-300 px-1 py-0.5 text-xs"
                        placeholder="notes"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <button
                        onClick={() => removePendingUpload(index)}
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

          {/* <button 
            onClick={handleCreateUpload}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm mb-3"
          >
            Create Upload
          </button> */}

          <div className="grid grid-cols-2 gap-2">
  <div>
    <button 
      onClick={() => downloadUpload('poolzilla')}
      className="w-full bg-blue-400 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs mb-1"
    >
      Poolzilla (.txt)
    </button>
    <button 
      onClick={() => downloadUploadExcel('poolzilla')}
      className="w-full bg-blue-300 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded text-xs"
    >
      Excel
    </button>
  </div>

  <div>
    <button 
      onClick={() => downloadUpload('bargain')}
      className="w-full bg-purple-400 hover:bg-purple-600 text-white font-bold py-1 px-2 rounded text-xs mb-1"
    >
      Bargain Ben (.txt)
    </button>
    <button 
      onClick={() => downloadUploadExcel('bargain')}
      className="w-full bg-purple-300 hover:bg-purple-500 text-white font-bold py-1 px-2 rounded text-xs"
    >
      Excel
    </button>
  </div>

  <div className="col-span-2">
    <button 
      onClick={() => downloadUpload('ebay')}
      className="w-full bg-green-400 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-xs mb-1"
    >
      eBay Upload (.csv)
    </button>
    <button 
      onClick={() => downloadUploadExcel('ebay')}
      className="w-full bg-green-300 hover:bg-green-500 text-white font-bold py-1 px-2 rounded text-xs"
    >
      Excel
    </button>
  </div>
</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-300 p-4 bg-blue-50">
          <h3 className="text-lg font-semibold mb-3">Order # Search & Staging</h3>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Enter Names (one per line, max 25)</label>
            <textarea
              value={bulkNameInput}
              onChange={(e) => setBulkNameInput(e.target.value)}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
              rows={4}
              placeholder="John Smith&#10;Jane Doe"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Optional Address Filter</label>
            <input
              type="text"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
              placeholder="City, State, or Address"
            />
          </div>
          
          <button 
            onClick={handleSearchNames}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm mb-3"
          >
            Search Orders (Last 3 Months)
          </button>
          
          <div className="mb-3 overflow-auto" style={{maxHeight: '150px'}}>
            <p className="text-xs font-semibold mb-1">Search Results ({nameSearchResults.length})</p>
            {nameSearchResults.map((order, index) => (
              <div key={index} className="text-xs border-b border-gray-200 py-1 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{order.name} - {order.orderId}</div>
                  <div className="text-gray-600">{order.marketplace} | {order.date}</div>
                  <div className="text-gray-500">{order.address}, {order.city}, {order.state}</div>
                </div>
                <button
                  onClick={() => addToStagedOrders(order)}
                  className="bg-green-400 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold mb-2">Staged Orders ({stagedOrders.length})</p>
            <div className="overflow-auto mb-3" style={{maxHeight: '120px'}}>
              {stagedOrders.map((order, index) => (
                <div key={index} className="text-xs border-b border-gray-200 py-1 flex justify-between items-center gap-2">
                  <div className="flex-1">
                    <div className="font-semibold">{order.orderId}</div>
                    <div className="text-gray-600">{order.name} - {order.marketplace}</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={order.quantity}
                    onChange={(e) => updateStagedOrderQty(order.orderId, parseInt(e.target.value) || 0)}
                    className="w-12 border border-gray-300 px-1 py-0.5 text-xs text-center"
                  />
                  <button
                    onClick={() => addOrderItemsToPending(order)}
                    className="bg-blue-400 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
                  >
                    Add to Pending
                  </button>
                  <button
                    onClick={() => removeFromStagedOrders(order.orderId)}
                    className="bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePopulateOrderLog}
                className="flex-1 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Populate Log
              </button>
              <button 
                onClick={exportOrdersCSV}
                className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 p-4 bg-green-50">
          <h3 className="text-lg font-semibold mb-3">LPN Staging</h3>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Enter LPN</label>
            <input
              type="text"
              value={lpnInput}
              onChange={(e) => setLpnInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLPNToStage()}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
              placeholder="LPN"
            />
          </div>
          
          <button 
            onClick={addLPNToStage}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm mb-3"
          >
            Add to Staging
          </button>
          
          <div className="border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold mb-2">Staged LPNs ({stagedLPNs.length})</p>
            <div className="overflow-auto mb-3" style={{maxHeight: '200px'}}>
              {stagedLPNs.map((item, index) => (
                <div key={index} className="text-xs border-b border-gray-200 py-1 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.lpn}</div>
                    <div className="text-gray-600">{item.date}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addLPNToPending(item.lpn)}
                      className="bg-blue-400 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Add to Pending
                    </button>
                    <button
                      onClick={() => removeStagedLPN(index)}
                      className="bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePopulateLPNLog}
                className="flex-1 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Populate Log
              </button>
              <button 
                onClick={exportLPNsCSV}
                className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 p-4 bg-red-50">
          <h3 className="text-lg font-semibold mb-3">Removal Staging</h3>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Enter ASIN/UPC</label>
            <input
              type="text"
              value={removalInput}
              onChange={(e) => setRemovalInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRemovalToStage()}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
              placeholder="ASIN or UPC"
            />
          </div>
          
          <button 
            onClick={addRemovalToStage}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm mb-3"
          >
            Add to Staging
          </button>
          
          <div className="border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold mb-2">Staged Removals ({stagedRemovals.length})</p>
            <div className="overflow-auto mb-3" style={{maxHeight: '200px'}}>
              {stagedRemovals.map((item, index) => (
                <div key={index} className="text-xs border-b border-gray-200 py-1 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.asinUpc}</div>
                    <div className="text-gray-600">{item.date}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addRemovalToPending(item.asinUpc)}
                      className="bg-blue-400 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Add to Pending
                    </button>
                    <button
                      onClick={() => removeStagedRemoval(index)}
                      className="bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePopulateRemovalLog}
                className="flex-1 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Populate Log
              </button>
              <button 
                onClick={exportRemovalsCSV}
                className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-300 p-4 bg-purple-50 mb-8">
        <h3 className="text-lg font-semibold mb-3">Order Location Lookup</h3>
        
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Enter Order Number</label>
            <input
              type="text"
              value={orderLocationSearch}
              onChange={(e) => setOrderLocationSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchOrderLocation()}
              className="w-full border border-gray-400 px-2 py-1 text-sm"
              placeholder="Order Number"
            />
          </div>
          
          <button 
            onClick={searchOrderLocation}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Search Location
          </button>
        </div>
        
        {locationResult && (
          <div className="mt-3 p-3 bg-white border border-purple-300 rounded">
            <p className="text-sm font-semibold">{locationResult}</p>
          </div>
        )}
      </div>
    </main>
  );
}