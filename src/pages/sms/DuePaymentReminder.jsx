import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Send, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DuePaymentReminder = () => {
  const [perOrders, setPerOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadedOrders = getStorageData('perOrders', []);
    const dueOrders = loadedOrders.filter(order => order.dueAmount > 0);
    setPerOrders(dueOrders);
    setFilteredOrders(dueOrders);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = perOrders.filter(order =>
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.phone.includes(searchQuery)
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(perOrders);
    }
  }, [searchQuery, perOrders]);

  const handleSendReminder = (order) => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent to ${order.customer?.name || 'customer'}`,
    });
  };

  const handleSendAll = () => {
    toast({
      title: "Reminders Sent",
      description: `Payment reminders sent to ${filteredOrders.length} customers`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Due Payment Reminder - iphone center.lk</title>
        <meta name="description" content="Send due payment reminders" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Due Payment Reminder
            </h1>
            <p className="text-muted-foreground mt-1">Send payment reminders to customers with due amounts</p>
          </div>
          {filteredOrders.length > 0 && (
            <Button onClick={handleSendAll} variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send All Reminders
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search orders with due payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <AlertTriangle className="w-16 h-16 mx-auto text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">All Clear!</h3>
            <p className="text-muted-foreground">No orders with due payments</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-yellow-500/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg font-mono">{order.id}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                          Due Payment
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {order.customer?.name || 'Unknown Customer'} - {order.customer?.phone}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Due: <span className="font-semibold text-primary">LKR {order.dueAmount.toLocaleString()}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleSendReminder(order)}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DuePaymentReminder;
