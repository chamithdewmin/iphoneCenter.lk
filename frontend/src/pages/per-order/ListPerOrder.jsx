import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2, Calendar, User, Package, DollarSign } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ListPerOrder = () => {
  const { isAdmin, selectedBranchId } = useBranchFilter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    const url = isAdmin && selectedBranchId ? `/api/per-orders?branchId=${selectedBranchId}` : '/api/per-orders';
    const { ok, data } = await authFetch(url);
    setLoading(false);
    const list = (ok && Array.isArray(data?.data)) ? data.data : [];
    setOrders(list);
    setFilteredOrders(list);
  }, [isAdmin, selectedBranchId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const ordNum = (order.order_number || order.id || '').toString().toLowerCase();
        const name = (order.customer_name || order.customer?.name || '').toLowerCase();
        const phone = (order.customer_phone || order.customer?.phone || '').toString();
        const email = (order.customer_email || order.customer?.email || '').toLowerCase();
        return ordNum.includes(q) || name.includes(q) || phone.includes(searchQuery) || email.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const { ok, data } = await authFetch(`/api/per-orders/${orderId}`, { method: 'DELETE' });
    if (!ok) {
      toast({ title: 'Delete failed', description: data?.message || 'Could not delete order', variant: 'destructive' });
      return;
    }
    toast({ title: 'Order Deleted', description: 'The order has been deleted successfully' });
    fetchOrders();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      completed: 'bg-green-500/20 text-green-600 dark:text-green-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>List Per Order - iphone center.lk</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">List Per Order</h1>
          <p className="text-muted-foreground">View and manage all per orders</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-4 border border-secondary">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-[200px] h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-lg border border-secondary overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {orders.length === 0 ? 'No per orders found. Create your first order!' : 'No orders match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-secondary rounded-lg p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{order.order_number || order.id}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{order.customer_name || order.customer?.name || '—'}</span>
                              <span className="text-sm text-muted-foreground">• {order.customer_phone || order.customer?.phone || '—'}</span>
                            </div>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Subtotal</p>
                            <p className="font-medium">LKR {(order.subtotal ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Advance Payment</p>
                            <p className="font-medium">LKR {(order.advance_payment ?? order.advancePayment ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Amount</p>
                            <p className={`font-semibold ${(order.due_amount ?? order.dueAmount ?? 0) > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
                              LKR {(order.due_amount ?? order.dueAmount ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.created_at || order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast({ title: 'View Order', description: `Order ${order.order_number || order.id}. Open Orders page for full view.` })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-secondary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  LKR {filteredOrders.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Advance</p>
                <p className="text-2xl font-bold">
                  LKR {filteredOrders.reduce((sum, o) => sum + (parseFloat(o.advance_payment ?? o.advancePayment) || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ListPerOrder;
