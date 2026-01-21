import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  Clock,
  Eye,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  medication: string;
  dosage: string;
  quantity: number;
  price: number;
  instructions?: string;
}

interface PharmacyOrder {
  _id: string;
  orderNumber: string;
  prescriptionId: {
    _id: string;
    medication?: string;
    dosage?: string;
  };
  patientId: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  doctorId: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Fulfilled' | 'PaymentRequested' | 'Paid' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'PaymentRequested' | 'Paid' | 'Refunded';
  paymentMethod?: string;
  paymentDate?: string;
  transactionId?: string;
  fulfilledBy?: { _id: string; name: string };
  fulfilledAt?: string;
  fulfillmentNotes?: string;
  deliveryMethod?: 'Pickup' | 'HomeDelivery';
  createdAt: string;
  updatedAt: string;
}

interface TransactionStats {
  totalRevenue: number;
  pendingPayments: number;
  completedOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalOrders: number;
}

interface TransactionData {
  orders: PharmacyOrder[];
  statistics: TransactionStats;
}

export const PharmacyTransactions: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<TransactionData>({
    orders: [],
    statistics: {
      totalRevenue: 0,
      pendingPayments: 0,
      completedOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      totalOrders: 0
    }
  });
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/pharmacy-orders/stats/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load transactions');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pharmacy transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (order: PharmacyOrder) => {
    const patient = order.patientId;
    if (patient.firstName || patient.lastName) {
      return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    }
    return patient.name || 'Unknown Patient';
  };

  const getDoctorName = (order: PharmacyOrder) => {
    const doctor = order.doctorId;
    if (doctor.firstName || doctor.lastName) {
      return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    }
    return doctor.name || 'Unknown Doctor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fulfilled':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PaymentRequested':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PaymentRequested':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Refunded':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const openDetailsDialog = (order: PharmacyOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const filteredOrders = data.orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      getPatientName(order).toLowerCase().includes(search) ||
      getDoctorName(order).toLowerCase().includes(search) ||
      order.transactionId?.toLowerCase().includes(search)
    );
  });

  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'Paid');
  const pendingPaymentOrders = filteredOrders.filter(o => o.paymentStatus === 'PaymentRequested');
  const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'Unpaid');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Transactions</h1>
          <p className="text-muted-foreground">View transaction history, billing, and payment status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.statistics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {data.statistics.paidOrders} paid orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.statistics.pendingPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting patient payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{data.statistics.pendingOrders} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, patient, doctor, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Transactions ({filteredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({paidOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Payment ({pendingPaymentOrders.length})
          </TabsTrigger>
          <TabsTrigger value="unpaid">
            Unpaid ({unpaidOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                orders={filteredOrders}
                onViewDetails={openDetailsDialog}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getPatientName={getPatientName}
                getDoctorName={getDoctorName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Paid Transactions</CardTitle>
              <CardDescription>Orders with completed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                orders={paidOrders}
                onViewDetails={openDetailsDialog}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getPatientName={getPatientName}
                getDoctorName={getDoctorName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Orders awaiting patient payment</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                orders={pendingPaymentOrders}
                onViewDetails={openDetailsDialog}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getPatientName={getPatientName}
                getDoctorName={getDoctorName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unpaid">
          <Card>
            <CardHeader>
              <CardTitle>Unpaid Orders</CardTitle>
              <CardDescription>Orders not yet fulfilled or paid</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                orders={unpaidOrders}
                onViewDetails={openDetailsDialog}
                getStatusColor={getStatusColor}
                getPaymentStatusColor={getPaymentStatusColor}
                getPatientName={getPatientName}
                getDoctorName={getDoctorName}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Complete order and payment information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Number</Label>
                  <div className="text-base font-semibold">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
                  <div className="text-base">{format(new Date(selectedOrder.createdAt), 'PPp')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Patient</Label>
                  <div className="text-base">{getPatientName(selectedOrder)}</div>
                  {selectedOrder.patientId.phone && (
                    <div className="text-sm text-muted-foreground">{selectedOrder.patientId.phone}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Doctor</Label>
                  <div className="text-base">{getDoctorName(selectedOrder)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                  <div>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedOrder.paymentStatus === 'Paid' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                      <div className="text-base font-mono">{selectedOrder.transactionId || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                      <div className="text-base">{selectedOrder.paymentMethod || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Date</Label>
                      <div className="text-base">
                        {selectedOrder.paymentDate ? format(new Date(selectedOrder.paymentDate), 'PPp') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Amount Paid</Label>
                      <div className="text-base font-bold text-green-600">
                        ${selectedOrder.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.medication}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.dosage} • Quantity: {item.quantity}
                        </div>
                        {item.instructions && (
                          <div className="text-sm text-muted-foreground mt-1">{item.instructions}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.price.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">per unit</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t">
                  <div className="font-semibold">Total Amount</div>
                  <div className="text-xl font-bold">${selectedOrder.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* Fulfillment Information */}
              {selectedOrder.fulfilledBy && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Fulfillment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Fulfilled By</Label>
                      <div className="text-base">{selectedOrder.fulfilledBy.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Fulfilled At</Label>
                      <div className="text-base">
                        {selectedOrder.fulfilledAt ? format(new Date(selectedOrder.fulfilledAt), 'PPp') : 'N/A'}
                      </div>
                    </div>
                    {selectedOrder.fulfillmentNotes && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                        <div className="text-base">{selectedOrder.fulfillmentNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Transaction Table Component
interface TransactionTableProps {
  orders: PharmacyOrder[];
  onViewDetails: (order: PharmacyOrder) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getPatientName: (order: PharmacyOrder) => string;
  getDoctorName: (order: PharmacyOrder) => string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  orders,
  onViewDetails,
  getStatusColor,
  getPaymentStatusColor,
  getPatientName,
  getDoctorName
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <div>{getPatientName(order)}</div>
                {order.patientId.phone && (
                  <div className="text-xs text-muted-foreground">{order.patientId.phone}</div>
                )}
              </TableCell>
              <TableCell>{getDoctorName(order)}</TableCell>
              <TableCell className="font-semibold">${order.totalAmount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(order.createdAt), 'PP')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PharmacyTransactions;
