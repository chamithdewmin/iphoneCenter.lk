import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, RotateCcw, DollarSign, Package, Save } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ReturnRefund = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('cash');
  const { toast } = useToast();

  useEffect(() => {
    const loadedOrders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...loadedOrders, ...perOrders];
    setOrders(allOrders);
    setFilteredOrders(allOrders);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(order =>
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setReturnItems(order.items || []);
    setRefundAmount(order.total || order.subtotal || 0);
  };

  const handleProcessRefund = () => {
    if (!selectedOrder) {
      toast({
        title: "Validation Error",
        description: "Please select an order",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Refund Processed",
      description: `Refund of LKR ${refundAmount.toLocaleString()} processed via ${refundMethod}`,
    });
    setSelectedOrder(null);
    setReturnItems([]);
    setRefundAmount(0);
  };

  return (
    <>
      <Helmet>
        <title>Return / Refund - iphone center.lk</title>
        <meta name="description" content="Process returns and refunds" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Return / Refund
          </h1>
          <p className="text-muted-foreground mt-1">Process returns and refunds for orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectOrder(order)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedOrder?.id === order.id
                      ? 'border-primary bg-primary/10'
                      : 'border-secondary hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold font-mono">{order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName || order.customer?.name}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">
                      LKR {(order.total || order.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Refund Details */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-secondary shadow-sm sticky top-6">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Refund Details</h2>
                {selectedOrder ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label>Refund Amount (LKR)</Label>
                        <Input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Refund Method</Label>
                        <select
                          value={refundMethod}
                          onChange={(e) => setRefundMethod(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                    <Button onClick={handleProcessRefund} className="w-full">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Process Refund
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                    <p className="text-sm text-muted-foreground">Select an order to process refund</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnRefund;
