import React, { useEffect, useState } from 'react';
import { equipmentService, Equipment, EquipmentFilters } from '@/services/equipmentService';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Plus, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EquipmentList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const isMyListings = location.pathname.toLowerCase().includes('my-listings');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let data: Equipment[] = [];
      if (isMyListings) {
        data = await equipmentService.getMyListings();
      } else {
        data = await equipmentService.getAll({ ...filters, search: searchTerm });
      }
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  useEffect(() => {
    // Refetch when route changes between marketplace and my-listings
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipment();
  };

  const handleBuy = async (id: string) => {
    if (!confirm('Are you sure you want to purchase this item?')) return;
    try {
      await equipmentService.buy(id);
      alert('Purchase successful!');
      fetchEquipment();
    } catch (error) {
      console.error('Error purchasing equipment:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{isMyListings ? 'My Equipment Listings' : 'Medical Equipment Marketplace'}</h1>
        <div className="flex gap-2">
          {!isMyListings && (
            <Button onClick={() => navigate('my-listings')} variant="outline">
              My Listings
            </Button>
          )}
          {!isMyListings && user?.role && String(user.role).toLowerCase() !== 'admin' && (
            <Button onClick={() => navigate('add')}>
              <Plus className="mr-2 h-4 w-4" /> Sell Equipment
            </Button>
          )}
          {!isMyListings && user?.role && String(user.role).toLowerCase() === 'admin' && (
            <Button disabled variant="ghost">
              Admin cannot sell
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input 
                placeholder="Search equipment..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select onValueChange={(val) => setFilters({...filters, category: val === 'all' ? undefined : val})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Oxygen Cylinder">Oxygen Cylinder</SelectItem>
                <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                <SelectItem value="Bed">Bed</SelectItem>
                <SelectItem value="Walker">Walker</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(val) => setFilters({...filters, condition: val === 'all' ? undefined : val})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Used">Used</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              {item.images && item.images.length > 0 && (
                <div className="h-48 bg-gray-100 relative">
                  <img 
                    src={item.images[0]} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2" variant={item.condition === 'New' ? 'default' : 'secondary'}>
                    {item.condition}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{item.name}</span>
                  <span className="text-lg font-bold text-primary">${item.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Category: {item.category}</span>
                  <span>Seller: {typeof item.sellerId === 'object' ? item.sellerId.name : 'Unknown'}</span>
                </div>
                {/* If viewing my-listings, show management actions */}
                {isMyListings ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/dashboard/${user?.role}/equipment`)}>
                      Back to Marketplace
                    </Button>
                    <Button variant="destructive" onClick={async () => {
                      if (!confirm('Delete this listing?')) return;
                      try {
                        await equipmentService.delete(item._id);
                        fetchEquipment();
                        alert('Listing deleted');
                      } catch (err) {
                        console.error('Failed to delete', err);
                        alert('Failed to delete listing');
                      }
                    }}>
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => handleBuy(item._id)} disabled={user?.role !== 'patient'}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> 
                    {user?.role === 'patient' ? 'Buy Now' : 'Login as Patient to Buy'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {equipment.length === 0 && (
            <div className="col-span-full text-center p-12 text-gray-500">
              No equipment found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
