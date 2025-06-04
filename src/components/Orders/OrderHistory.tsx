import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Package, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  created_at: string | null;
  user_id: string;
  total_amount: number;
  status: string; // Changed from union type to string to match database
  payment_method: string;
  shipping_address: any; // Changed to any to match Json type from database
  order_items: OrderItem[];
}

interface OrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, isLoading }) => {
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <Skeleton className="h-[150px] w-full rounded-xl" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-lens-purple/10 p-3">
            <ShoppingBag className="h-8 w-8 text-lens-purple" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground mt-1">
              Visit our pharmacy to make your first purchase.
            </p>
          </div>
          <Link 
            to="/pharmacy" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-lens-purple text-white hover:bg-lens-purple/90 h-10 px-4 py-2"
          >
            Browse Pharmacy
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <div className={`h-1.5 w-full ${
            order.status === 'delivered' ? 'bg-green-500' :
            order.status === 'shipped' ? 'bg-indigo-500' :
            order.status === 'processing' ? 'bg-blue-500' :
            order.status === 'cancelled' ? 'bg-red-500' :
            'bg-yellow-500'
          }`} />
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(order.status)}
                    <span className="text-sm text-gray-500">Order #{order.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    Order placed on {formatDate(order.created_at)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Payment Method: <span className="capitalize">{order.payment_method}</span>
                  </p>
                </div>
                <p className="text-xl font-bold">
                  GH₵{order.total_amount.toFixed(2)}
                </p>
              </div>
              
              <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Items</p>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>
                          {item.product_name} <span className="text-gray-500">x{item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-medium">GH₵{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Shipping Address</p>
                  <p className="text-gray-600 mt-1">
                    {order.shipping_address.firstName} {order.shipping_address.lastName}
                  </p>
                  <p className="text-gray-600">
                    {order.shipping_address.address}
                  </p>
                  <p className="text-gray-600">
                    {order.shipping_address.city}, {order.shipping_address.postalCode}
                  </p>
                  <p className="text-gray-600">
                    {order.shipping_address.phone}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderHistory;
