import React, { useEffect, useState } from 'react';
import { equipmentService } from '@/services/equipmentService';

export const AdminUsedEquipmentSales: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await equipmentService.getUsedSales();
      setSales(data || []);
    } catch (err) {
      console.error('Failed to load used equipment sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Used Equipment Sales</h2>
      {loading && <div>Loading...</div>}
      {!loading && sales.length === 0 && <div>No sales found.</div>}
      {!loading && sales.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Equipment</th>
                <th className="text-left p-2">Buyer</th>
                <th className="text-left p-2">Seller</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-2">{s._id}</td>
                  <td className="p-2">{s.equipment?.name || s.equipment}</td>
                  <td className="p-2">{s.buyer?.name || s.buyer}</td>
                  <td className="p-2">{s.seller?.name || s.seller}</td>
                  <td className="p-2">{s.amount}</td>
                  <td className="p-2">{s.status}</td>
                  <td className="p-2">{new Date(s.transactionDate || s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsedEquipmentSales;
