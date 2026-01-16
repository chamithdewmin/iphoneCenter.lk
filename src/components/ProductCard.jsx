import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const ProductCard = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const brand = product.brand || product.make || '';
  const model = product.model || '';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-card rounded-lg overflow-hidden border border-secondary shadow-lg transition-shadow hover:shadow-2xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.images?.[0] || product.image || '/placeholder-phone.png'}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {product.condition === 'new' && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
            NEW
          </span>
        )}
        {product.stock <= 2 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Low Stock
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg">{brand} {model}</h3>
          <p className="text-sm text-muted-foreground">{product.year || ''} {product.category || ''}</p>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-2">
            {product.colors.slice(0, 3).map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-xs text-muted-foreground">+{product.colors.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-secondary">
          <span className="text-2xl font-bold text-primary">LKR {product.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">Stock: {product.stock || 0}</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onQuickView}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            onClick={() => addToCart(product)}
            size="sm"
            className="flex-1"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;