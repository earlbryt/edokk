import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { CartItem } from '@/context/CartContext';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface OrderDetails {
  cartItems: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
}

/**
 * Creates a new order in the database
 */
export const createOrder = async (orderDetails: OrderDetails) => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('You must be logged in to place an order');
    }
    
    const userId = sessionData.session.user.id;
    
    // Create the order - using generic table access to avoid type issues
    const response = await supabase
      .from('orders' as any)
      .insert({
        user_id: userId,
        total_amount: orderDetails.totalAmount,
        status: 'pending',
        payment_method: orderDetails.paymentMethod,
        shipping_address: orderDetails.shippingAddress
      })
      .select()
      .single();
      
    const order = response.data as any;
    const orderError = response.error as PostgrestError;
    
    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }
    
    // Create order items
    const orderItems = orderDetails.cartItems.map(item => ({
      order_id: order?.id,
      product_id: item.productId,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items' as any)
      .insert(orderItems as any);
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }
    
    return order;
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};

/**
 * Gets all orders for the current user
 */
export const getUserOrders = async () => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('You must be logged in to view orders');
    }
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders' as any)
      .select(`
        *,
        order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw new Error('Failed to fetch orders');
    }
    
    return orders || [];
  } catch (error) {
    console.error('Get user orders failed:', error);
    throw error;
  }
};

/**
 * Gets a specific order by ID
 */
export const getOrderById = async (orderId: string) => {
  try {
    const { data: order, error } = await supabase
      .from('orders' as any)
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
    
    return order;
  } catch (error) {
    console.error('Get order by ID failed:', error);
    throw error;
  }
};
