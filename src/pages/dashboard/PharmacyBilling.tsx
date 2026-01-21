import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pill, CreditCard, ShoppingCart, Search, 
  Plus, Minus, Receipt, Check, Eye, FileText
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from 'date-fns';

interface Prescription {
  _id: string;
  patientId: any;
  doctorId: any;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  notes?: string;
  createdAt: string;
  paymentStatus?: string;
}

export const PharmacyBilling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('authToken');
  const isPatient = user?.role === 'patient';

  const medications = [
    { id: '1', name: 'Amoxicillin', dosage: '500mg', price: 12.50, stock: 'In Stock', category: 'Antibiotics' },
    { id: '2', name: 'Lisinopril', dosage: '10mg', price: 8.00, stock: 'In Stock', category: 'Cardiovascular' },
    { id: '3', name: 'Metformin', dosage: '500mg', price: 5.00, stock: 'Low Stock', category: 'Diabetes' },
    { id: '4', name: 'Atorvastatin', dosage: '20mg', price: 15.00, stock: 'In Stock', category: 'Cardiovascular' },
    { id: '5', name: 'Amlodipine', dosage: '5mg', price: 6.50, stock: 'In Stock', category: 'Cardiovascular' },
    { id: '6', name: 'Omeprazole', dosage: '20mg', price: 9.00, stock: 'In Stock', category: 'Gastrointestinal' },
  ];

  useEffect(() => {
    if (isPatient) {
      loadMyPrescriptions();
    }
  }, [isPatient]);

  const loadMyPrescriptions = async () => {
    try {
      // First get user profile to find patient ID
      const profileRes = await fetch(`${backendUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!profileRes.ok) throw new Error('Failed to load profile');
      const profile = await profileRes.json();
      
      // Then get patient record
      const patientsRes = await fetch(`${backendUrl}/api/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!patientsRes.ok) throw new Error('Failed to load patients');
      const patients = await patientsRes.json();
      const myPatient = Array.isArray(patients) 
        ? patients.find((p: any) => p.userId === profile._id || p.userId === profile.id)
        : null;
      
      if (!myPatient) return;
      
      // Finally get prescriptions
      const rxRes = await fetch(`${backendUrl}/api/prescriptions/${myPatient._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!rxRes.ok) throw new Error('Failed to load prescriptions');
      const data = await rxRes.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load prescriptions:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedPrescription) return;

    try {
      setProcessing(true);
      const response = await fetch(`${backendUrl}/api/payments/medicine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prescriptionId: selectedPrescription._id,
          paymentMethod,
        }),
      });

      if (!response.ok) throw new Error('Payment failed');

      toast({
        title: 'Payment Successful',
        description: 'Your prescription has been paid for',
      });

      setIsPaymentOpen(false);
      setSelectedPrescription(null);
      loadMyPrescriptions();
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) newCart[id]--;
      else delete newCart[id];
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const med = medications.find(m => m.id === id);
    return total + (med ? med.price * qty : 0);
  }, 0);

  const getPatientName = (patient: any) => {
    if (!patient) return 'Unknown Patient';
    if (typeof patient === 'string') return 'Patient';
    return patient.name || patient.firstName || 'Patient';
  };

  const getDoctorName = (doctor: any) => {
    if (!doctor) return 'Unknown Doctor';
    if (typeof doctor === 'string') return 'Doctor';
    return doctor.name || doctor.firstName || 'Doctor';
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      'Active': { className: 'bg-green-100 text-green-700' },
      'Pending': { className: 'bg-yellow-100 text-yellow-700' },
      'Fulfilled': { className: 'bg-blue-100 text-blue-700' },
      'Expired': { className: 'bg-red-100 text-red-700' },
    };

    const statusConfig = config[status] || config['Pending'];
    return <Badge className={statusConfig.className}>{status}</Badge>;
  };

  const activePrescriptions = useMemo(() => {
    return prescriptions.filter(rx => rx.status === 'Active' || rx.status === 'Pending');
  }, [prescriptions]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Pill className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy & Billing</h1>
          <p className="text-muted-foreground">
            {isPatient ? 'View your prescriptions and make payments' : 'Order medications and manage payments'}
          </p>
        </div>
      </div>

      <Tabs defaultValue={isPatient ? "prescriptions" : "pharmacy"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          {isPatient && <TabsTrigger value="prescriptions">My Prescriptions</TabsTrigger>}
          <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* My Prescriptions Tab (Patient Only) */}
        {isPatient && (
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>My Prescriptions</CardTitle>
                <CardDescription>Doctor-prescribed medications</CardDescription>
              </CardHeader>
              <CardContent>
                {activePrescriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No active prescriptions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePrescriptions.map((rx) => (
                        <TableRow key={rx._id}>
                          <TableCell className="font-medium">{rx.medication}</TableCell>
                          <TableCell>{rx.dosage}</TableCell>
                          <TableCell>{rx.frequency}</TableCell>
                          <TableCell>{getDoctorName(rx.doctorId)}</TableCell>
                          <TableCell>{format(new Date(rx.createdAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{getStatusBadge(rx.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPrescription(rx);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {rx.paymentStatus !== 'Paid' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPrescription(rx);
                                    setIsPaymentOpen(true);
                                  }}
                                >
                                  <CreditCard className="h-3 w-3 mr-2" />
                                  Pay
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Pharmacy Tab */}
        <TabsContent value="pharmacy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Medications List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Medications</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search medications..." className="pl-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{med.name} <span className="text-sm font-normal text-muted-foreground">({med.dosage})</span></h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{med.category}</span>
                            <span>•</span>
                            <span className={med.stock === 'Low Stock' ? 'text-amber-600' : 'text-green-600'}>{med.stock}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">${med.price.toFixed(2)}</span>
                        {cart[med.id] ? (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => removeFromCart(med.id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center">{cart[med.id]}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => addToCart(med.id)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(med.id)}>
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {Object.entries(cart).map(([id, qty]) => {
                        const med = medications.find(m => m.id === id);
                        if (!med) return null;
                        return (
                          <div key={id} className="flex justify-between text-sm">
                            <span>{med.name} x{qty}</span>
                            <span>${(med.price * qty).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button className="w-full" onClick={() => {
                        toast({
                          title: 'Order Placed',
                          description: 'Your order has been placed successfully',
                        });
                        setCart({});
                      }}>
                        Checkout
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No payment history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Pay for your prescription
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p><strong>Medication:</strong> {selectedPrescription.medication}</p>
                <p><strong>Dosage:</strong> {selectedPrescription.dosage}</p>
                <p><strong>Amount:</strong> $25.00</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={processing}>
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Medication</Label>
                  <p className="font-medium">{selectedPrescription.medication}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dosage</Label>
                  <p className="font-medium">{selectedPrescription.dosage}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="font-medium">{selectedPrescription.frequency}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">{selectedPrescription.duration}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{getDoctorName(selectedPrescription.doctorId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPrescription.status)}</div>
                </div>
              </div>
              {selectedPrescription.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyBilling;
