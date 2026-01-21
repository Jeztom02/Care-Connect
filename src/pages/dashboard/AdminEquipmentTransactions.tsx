import React, { useEffect, useMemo, useState } from 'react';
import { equipmentService } from '@/services/equipmentService';

export const AdminEquipmentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await equipmentService.getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let items = transactions.slice();
    if (status) {
      items = items.filter((t) => String(t.status || '').toLowerCase() === status.toLowerCase());
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      items = items.filter((t) => {
        const ts = new Date(t.transactionDate || t.createdAt).getTime();
        return ts >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      items = items.filter((t) => {
        const ts = new Date(t.transactionDate || t.createdAt).getTime();
        return ts <= to;
      });
    }
    return items;
  }, [transactions, status, dateFrom, dateTo]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Equipment Transactions</h2>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Any</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
        </div>

        <div>
          <label className="text-sm block mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
        </div>

        <div>
          <label className="text-sm block mb-1">Page Size</label>
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">Total: {total}</div>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && total === 0 && <div>No transactions found.</div>}

      {!loading && total > 0 && (
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
              {pageItems.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="p-2">{t._id}</td>
                  <td className="p-2">{t.equipment?.name || t.equipment}</td>
                  <td className="p-2">{t.buyer?.name || t.buyer}</td>
                  <td className="p-2">{t.seller?.name || t.seller}</td>
                  <td className="p-2">{t.amount}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{new Date(t.transactionDate || t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminEquipmentTransactions;
