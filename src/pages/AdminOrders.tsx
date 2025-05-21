
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import LoadingAnimation from '@/components/ui/loading-animation';
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
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle, 
  Search, 
  PackageSearch, 
  Truck,
  ArrowDown,
  ArrowUp,
  Eye
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
          return { ...order, profiles: profilesMap[order.user_id] };
        }
        return { ...order, profiles: { name: 'Unknown User', email: '' } };
      });

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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">Cancelled</Badge>;
      case 'in_transit':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">In Transit</Badge>;
      case 'out_of_delivery':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">Out for Delivery</Badge>;
      case 'delayed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">Delayed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for a new field
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort orders
  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.profiles?.name.toLowerCase().includes(query) ||
        order.profiles?.email.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.shipping_address.city.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'customer':
          comparison = (a.profiles?.name || '').localeCompare(b.profiles?.name || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'total_amount':
          comparison = a.total_amount - b.total_amount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  // Pagination
  const itemsPerPage = 10;
  const filteredOrders = getFilteredOrders();
  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sort indicator
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUp className="inline-block h-3 w-3 ml-1" /> : 
      <ArrowDown className="inline-block h-3 w-3 ml-1" />;
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
              <PackageSearch className="mr-2 h-5 w-5 text-lens-purple" />
              Order Management
            </h1>
            <p className="text-gray-500">View and manage customer orders</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 focus-visible:ring-lens-purple"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-10">
                <LoadingAnimation message="Loading orders..." />
              </div>
            ) : paginatedOrders.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">There are no orders matching your criteria.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('id')}
                      >
                        Order ID <SortIndicator field="id" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('customer')}
                      >
                        Customer <SortIndicator field="customer" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('created_at')}
                      >
                        Date <SortIndicator field="created_at" />
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('total_amount')}
                      >
                        Amount <SortIndicator field="total_amount" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        Status <SortIndicator field="status" />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.profiles?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{order.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                            {order.order_items.length} item(s)
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">GH₵{order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewOrderDetails(order)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            
                            {order.status !== 'delivered' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                disabled={updatingStatus}
                              >
                                <Truck className="h-3.5 w-3.5 mr-1" />
                                Mark as delivered
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="border-t px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
                  </div>
                  
                  {pageCount > 1 && (
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                          let pageNum = i + 1;
                          // Show pages around current page for many pages
                          if (pageCount > 5) {
                            if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= pageCount - 2) {
                              pageNum = pageCount - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {currentPage < pageCount && (
                          <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Order Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Order Details</DialogTitle>
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
