import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Package, Search, Truck } from 'lucide-react';

// Define types for orders and order items
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  order_items: OrderItem[];
  // Add profile data
  profiles?: {
    name: string;
    email: string;
  };
}

const AdminOrders: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Format date safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString.toString().split('T')[0] || 'Invalid date';
    }
  };

  // Fetch all orders with user information
  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching orders...');
      // First, get all orders with their items
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched successfully:', ordersData?.length || 0);
      
      // Collect all user IDs from orders to fetch in one batch
      const userIds = [...new Set((ordersData || []).map(order => order.user_id).filter(Boolean))];
      console.log('User IDs to fetch:', userIds);
      
      // Fetch all profiles in one go
      let profilesMap: { [key: string]: { name: string; email: string } } = {};
      
      if (userIds.length > 0) {
        // Use a direct SQL query to bypass RLS for admin users
        const { data: profilesData, error: profilesError } = await supabase
          .rpc('admin_get_profiles_by_ids', { user_ids: userIds });
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profilesData) {
          // Create a map for quick lookup
          profilesData.forEach((profile: any) => {
            if (profile && profile.id) {
              profilesMap[profile.id] = {
                name: profile.name || 'Unknown User',
                email: profile.email || ''
              };
            }
          });
          console.log('Profiles loaded:', Object.keys(profilesMap).length);
        }
      }

      // Attach profiles to orders
      const ordersWithProfiles = (ordersData || []).map((order: any) => {
        if (order.user_id && profilesMap[order.user_id]) {
          console.log(`Profile matched for user_id: ${order.user_id}`);
          return { ...order, profiles: profilesMap[order.user_id] };
        }
        return { ...order, profiles: { name: 'Unknown User', email: '' } };
      });


      console.log('Orders with profiles:', ordersWithProfiles.length);
      
      // Add type safety for the returned data
      const typedOrders = ordersWithProfiles as Order[];
      setOrders(typedOrders || []);
    } catch (error) {
      console.error('Error in fetchOrders function:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: 'delivered') => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders' as any)
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      // If currently viewing this order, update selected order state too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      toast({
        title: 'Order Updated',
        description: `Order #${orderId.substring(0, 8).toUpperCase()} has been marked as ${newStatus}.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update order status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // View order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Load orders when component mounts
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Management</h1>
            <p className="text-gray-600">Manage and monitor customer orders</p>
          </div>

          {loading ? (
            <LoadingAnimation message="Loading orders..." />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>All Orders</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchOrders} 
                    className="flex items-center gap-1"
                  >
                    <Package className="h-4 w-4" />
                    <span>Refresh Orders</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no customer orders in the system yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {order.profiles?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>{order.order_items.length} item(s)</TableCell>
                          <TableCell className="font-semibold">GH₵{order.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => viewOrderDetails(order)}
                              >
                                <Search className="h-3.5 w-3.5 mr-1" />
                                Details
                              </Button>
                              
                              {order.status !== 'delivered' && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  disabled={updatingStatus}
                                >
                                  <Truck className="h-3.5 w-3.5 mr-1" />
                                  Mark Delivered
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
          )}

          {/* Order Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  Order #{selectedOrder?.id.substring(0, 8).toUpperCase()} placed on {formatDate(selectedOrder?.created_at)}
                </DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div>{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                      <div className="font-medium capitalize">{selectedOrder.payment_method}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Name</div>
                        <div className="font-medium">
                          {selectedOrder.profiles?.name || `${selectedOrder.shipping_address.firstName} ${selectedOrder.shipping_address.lastName}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Email</div>
                        <div className="font-medium">{selectedOrder.profiles?.email || 'Not available'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Phone</div>
                        <div className="font-medium">{selectedOrder.shipping_address.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Address</div>
                        <div className="font-medium">
                          {selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.postalCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Order Items</h3>
                    <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.order_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">GH₵{item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">
                                GH₵{(item.price * item.quantity).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              GH₵{selectedOrder.total_amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                      Close
                    </Button>
                    
                    {selectedOrder.status !== 'delivered' && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'delivered');
                          setDetailsOpen(false);
                        }}
                        disabled={updatingStatus}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default AdminOrders;
