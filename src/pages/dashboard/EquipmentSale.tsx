import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, Search, Filter, Tag, 
  Info, ShoppingCart, Star 
} from "lucide-react";

export const EquipmentSale = () => {
  const [category, setCategory] = useState('All');

  const equipment = [
    {
      id: '1',
      name: 'Wheelchair - Lightweight',
      price: 150.00,
      condition: 'Used - Good',
      category: 'Mobility',
      description: 'Foldable lightweight wheelchair, barely used. Includes cushion.',
      image: '/placeholder-wheelchair.jpg',
      rating: 4.5
    },
    {
      id: '2',
      name: 'Hospital Bed - Electric',
      price: 450.00,
      condition: 'Used - Like New',
      category: 'Furniture',
      description: 'Fully adjustable electric hospital bed with mattress. Remote control included.',
      image: '/placeholder-bed.jpg',
      rating: 5.0
    },
    {
      id: '3',
      name: 'Oxygen Concentrator',
      price: 300.00,
      condition: 'Refurbished',
      category: 'Respiratory',
      description: '5L Oxygen concentrator, recently serviced. New filters.',
      image: '/placeholder-oxygen.jpg',
      rating: 4.0
    },
    {
      id: '4',
      name: 'Walker with Seat',
      price: 45.00,
      condition: 'Used - Fair',
      category: 'Mobility',
      description: 'Standard walker with padded seat and storage basket.',
      image: '/placeholder-walker.jpg',
      rating: 4.2
    },
    {
      id: '5',
      name: 'Blood Pressure Monitor',
      price: 25.00,
      condition: 'New',
      category: 'Monitoring',
      description: 'Digital upper arm blood pressure monitor. Batteries included.',
      image: '/placeholder-bp.jpg',
      rating: 4.8
    }
  ];

  const categories = ['All', 'Mobility', 'Furniture', 'Respiratory', 'Monitoring'];

  const filteredEquipment = category === 'All' 
    ? equipment 
    : equipment.filter(item => item.category === category);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipment Sales</h1>
            <p className="text-muted-foreground">Buy and sell used medical equipment</p>
          </div>
        </div>
        <Button>
          <Tag className="h-4 w-4 mr-2" />
          List Item for Sale
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-lg">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search equipment..." className="pl-8" />
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-muted relative group">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                <ShoppingBag className="h-12 w-12 opacity-20" />
              </div>
              {/* Placeholder for actual image */}
              {/* <img src={item.image} alt={item.name} className="object-cover w-full h-full" /> */}
              
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  {item.condition}
                </Badge>
              </div>
            </div>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">{item.category}</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                  <Star className="h-3 w-3 fill-current" />
                  {item.rating}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {item.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button className="w-full gap-2">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
