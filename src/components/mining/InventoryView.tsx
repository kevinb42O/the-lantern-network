import { useState } from 'react';
import { Package, Coins, ChartLineUp, ArrowRight } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { InventoryItem } from '@/lib/resources';
import { RARITY_CONFIG, type ResourceRarity } from '@/lib/resources';

interface InventoryViewProps {
  items: InventoryItem[];
  loading: boolean;
  onSell: (resourceTypeId: string, quantity: number) => Promise<boolean>;
  totalValue: number;
  totalCount: number;
}

export function InventoryView({ items, loading, onSell, totalValue, totalCount }: InventoryViewProps) {
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [selling, setSelling] = useState(false);

  const handleSell = async () => {
    if (!sellItem) return;
    
    setSelling(true);
    const success = await onSell(sellItem.resource_type_id, sellQuantity);
    setSelling(false);
    
    if (success) {
      toast.success(`Sold ${sellQuantity}x ${sellItem.resource_type?.name} for ${(sellItem.resource_type?.base_value || 0) * sellQuantity} 🏮`);
      setSellItem(null);
      setSellQuantity(1);
    }
  };

  // Group items by rarity for display
  const groupedItems = items.reduce((acc, item) => {
    const rarity = (item.resource_type?.rarity || 'common') as ResourceRarity;
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(item);
    return acc;
  }, {} as Record<ResourceRarity, InventoryItem[]>);

  const rarityOrder: ResourceRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Package size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Coins size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold">{totalValue} 🏮</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <Card className="bg-card/60">
          <CardContent className="p-8 text-center">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Resources Yet</h3>
            <p className="text-sm text-muted-foreground">
              Explore the map and mine resources to fill your inventory!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Items by Rarity */}
      {rarityOrder.map(rarity => {
        const rarityItems = groupedItems[rarity];
        if (!rarityItems || rarityItems.length === 0) return null;

        const config = RARITY_CONFIG[rarity];

        return (
          <Card key={rarity} className={`${config.bgColor} border ${config.borderColor}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium capitalize ${config.color}`}>
                {rarity} Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rarityItems.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setSellItem(item);
                    setSellQuantity(1);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.resource_type?.icon}</span>
                    <div>
                      <p className="font-medium">{item.resource_type?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.resource_type?.base_value} 🏮 each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-bold">
                      x{item.quantity}
                    </Badge>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Sell Dialog */}
      <Dialog open={!!sellItem} onOpenChange={() => setSellItem(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChartLineUp size={20} className="text-primary" />
              Sell Resource
            </DialogTitle>
            <DialogDescription>
              Convert resources to Lanterns
            </DialogDescription>
          </DialogHeader>

          {sellItem && (
            <div className="space-y-4 py-2">
              {/* Item Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <span className="text-4xl">{sellItem.resource_type?.icon}</span>
                <div>
                  <p className="font-semibold">{sellItem.resource_type?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    You have: {sellItem.quantity}
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity to sell</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                    disabled={sellQuantity <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold w-12 text-center">{sellQuantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSellQuantity(Math.min(sellItem.quantity, sellQuantity + 1))}
                    disabled={sellQuantity >= sellItem.quantity}
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSellQuantity(sellItem.quantity)}
                    className="ml-2"
                  >
                    Max
                  </Button>
                </div>
              </div>

              {/* Total Value */}
              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">You will receive</p>
                <p className="text-2xl font-bold text-primary">
                  {(sellItem.resource_type?.base_value || 0) * sellQuantity} 🏮
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSellItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 btn-glow"
                  onClick={handleSell}
                  disabled={selling}
                >
                  {selling ? 'Selling...' : 'Sell Now'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
