import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ShoppingCart, CreditCard, Clock, 
  CheckCircle, Package, Eye, DollarSign,
  FileText, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

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
    notes?: string;
  };
  patientId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Fulfilled' | 'PaymentRequested' | 'Paid' | 'Completed' | 'Cancelled' | 'Refunded';
  paymentStatus: 'Pending' | 'Requested' | 'Paid' | 'Refunded';
  fulfilledBy?: { _id: string; name: string };
  fulfilledAt?: string;
  fulfillmentNotes?: string;
  deliveryMethod?: 'Pickup' | 'Delivery';
  createdAt: string;
  updatedAt: string;
}

export const PatientPharmacyOrders: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/pharmacy-orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load orders');
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your pharmacy orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/pharmacy-orders/${selectedOrder._id}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod,
            amount: selectedOrder.totalAmount,
          }),
        }
      );

      if (!response.ok) throw new Error('Payment failed');

      toast({
        title: 'Payment Successful',
        description: `Payment of $${selectedOrder.totalAmount.toFixed(2)} processed successfully`,
      });

      setIsPaymentOpen(false);
      loadOrders();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openPaymentDialog = (order: PharmacyOrder) => {
    setSelectedOrder(order);
    setPaymentMethod('credit-card');
    setIsPaymentOpen(true);
  };

  const openDetailsDialog = (order: PharmacyOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Fulfilled':
        return 'bg-green-100 text-green-800';
      case 'PaymentRequested':
        return 'bg-purple-100 text-purple-800';
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Requested':
        return 'bg-purple-100 text-purple-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingPayments = orders.filter(
    (o) => o.paymentStatus === 'Requested' && o.status === 'PaymentRequested'
  );

  const completedOrders = orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Paid'
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Pharmacy Orders</h1>
          <p className="text-muted-foreground">View and manage your medication orders</p>
        </div>
        <Button variant="outline" onClick={loadOrders}>
          <Package className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Payment Alerts */}
      {pendingPayments.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <AlertCircle className="h-5 w-5" />
              Payment Required
            </CardTitle>
            <CardDescription>
              You have {pendingPayments.length} order(s) waiting for payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} item(s) • Total: ${order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    onClick={() => openPaymentDialog(order)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length})
          </TabsTrigger>
          <TabsTrigger value="payment">
            Payment Required ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <OrdersTable 
            orders={orders}
            onViewDetails={openDetailsDialog}
            onPayNow={openPaymentDialog}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <OrdersTable 
            orders={orders.filter(o => o.status === 'Pending' || o.status === 'Processing')}
            onViewDetails={openDetailsDialog}
            onPayNow={openPaymentDialog}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <OrdersTable 
            orders={pendingPayments}
            onViewDetails={openDetailsDialog}
            onPayNow={openPaymentDialog}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <OrdersTable 
            orders={completedOrders}
            onViewDetails={openDetailsDialog}
            onPayNow={openPaymentDialog}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
          />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Number</Label>
                  <div className="text-sm">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Doctor</Label>
                  <div className="text-sm">{selectedOrder.doctorId?.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <div className="text-sm">
                    {format(new Date(selectedOrder.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Medications</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="border p-3 rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{item.medication}</div>
                          <div className="text-sm text-muted-foreground">
                            Dosage: {item.dosage} | Quantity: {item.quantity}
                          </div>
                          {item.instructions && (
                            <div className="text-sm text-muted-foreground">
                              Instructions: {item.instructions}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-medium">Total Amount</Label>
                  <div className="text-2xl font-bold">${selectedOrder.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              {selectedOrder.fulfillmentNotes && (
                <div>
                  <Label className="text-sm font-medium">Pharmacy Notes</Label>
                  <div className="text-sm mt-1 p-2 bg-muted rounded">
                    {selectedOrder.fulfillmentNotes}
                  </div>
                </div>
              )}

              {selectedOrder.fulfilledAt && (
                <div>
                  <Label className="text-sm font-medium">Fulfilled Date</Label>
                  <div className="text-sm">
                    {format(new Date(selectedOrder.fulfilledAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Method</Label>
                  <div className="text-sm">{selectedOrder.deliveryMethod || 'Pickup'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <div>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedOrder && selectedOrder.paymentStatus === 'Requested' && (
              <Button 
                onClick={() => {
                  setIsDetailsOpen(false);
                  openPaymentDialog(selectedOrder);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Complete your payment for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Order Total</span>
                  <span className="text-2xl font-bold">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedOrder.items.length} item(s)
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                  <div className="flex items-center space-x-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit/Debit Card</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="insurance" id="insurance" />
                    <Label htmlFor="insurance" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Insurance</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Cash on Pickup</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Payment is secure and processed instantly
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} className="bg-purple-600 hover:bg-purple-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${selectedOrder?.totalAmount.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable Orders Table Component
interface OrdersTableProps {
  orders: PharmacyOrder[];
  onViewDetails: (order: PharmacyOrder) => void;
  onPayNow: (order: PharmacyOrder) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewDetails,
  onPayNow,
  getStatusColor,
  getPaymentStatusColor,
}) => {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-lg font-medium">No orders found</div>
          <div className="text-sm text-muted-foreground">Your pharmacy orders will appear here</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Items</TableHead>
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
                <TableCell>{order.doctorId?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx}>{item.medication}</div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{order.items.length - 2} more
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">${order.totalAmount.toFixed(2)}</TableCell>
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
                <TableCell>{format(new Date(order.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.paymentStatus === 'Requested' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onPayNow(order)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
