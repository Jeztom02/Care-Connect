import React, { useState } from 'react';
import { equipmentService } from '@/services/equipmentService';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export const AddEquipment: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    condition: 'Used',
    price: '',
    location: '',
    contactPhone: '',
    images: [] as string[] // Placeholder for image upload logic
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await equipmentService.create({
        ...formData,
        price: Number(formData.price),
        condition: formData.condition as 'New' | 'Used'
      });
      alert('Equipment listed successfully! It may need approval if you are a patient.');
      navigate('/dashboard/patient/equipment'); // Adjust route as needed
    } catch (error) {
      console.error('Error listing equipment:', error);
      alert('Failed to list equipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sell Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(val) => handleSelectChange('category', val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oxygen Cylinder">Oxygen Cylinder</SelectItem>
                  <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                  <SelectItem value="Bed">Bed</SelectItem>
                  <SelectItem value="Walker">Walker</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select onValueChange={(val) => handleSelectChange('condition', val)} defaultValue="Used">
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="City, State" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Optional" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
