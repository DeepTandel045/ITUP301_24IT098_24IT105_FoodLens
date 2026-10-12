import React, { useEffect, useState } from 'react';
import { smartBasketService } from '../services/api';
import type { ShoppingList } from '../types';
import { 
  ShoppingBag, 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus
} from 'lucide-react';

interface MyListsPageProps {
  onNavigate: (tab: string, data?: any) => void;
}

export const MyListsPage: React.FC<MyListsPageProps> = ({ onNavigate }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchLists();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const serverLists = await smartBasketService.getShoppingLists();
      if (serverLists && serverLists.length > 0) {
        setLists(serverLists);
        setSelectedList(serverLists[0]);
        // Cache to local storage
        localStorage.setItem('foodlens_saved_lists_cache', JSON.stringify(serverLists));
      } else {
        checkLocalCache();
      }
    } catch (err) {
      checkLocalCache();
    } finally {
      setLoading(false);
    }
  };

  const checkLocalCache = () => {
    const cached = localStorage.getItem('foodlens_saved_lists_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLists(parsed);
        if (parsed.length > 0) setSelectedList(parsed[0]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleItem = async (listId: number, itemId: number, currentStatus: boolean) => {
    if (!selectedList) return;

    // Optimistic UI update
    const updatedItems = selectedList.items.map(item => 
      item.id === itemId ? { ...item, is_purchased: !currentStatus } : item
    );
    const updatedList = { ...selectedList, items: updatedItems };
    setSelectedList(updatedList);
    setLists(prev => prev.map(l => l.id === listId ? updatedList : l));

    try {
      await smartBasketService.updateListItem(listId, itemId, { is_purchased: !currentStatus });
    } catch (err) {
      // If offline, save in localStorage
      localStorage.setItem(`foodlens_list_${listId}`, JSON.stringify(updatedList));
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!window.confirm('Delete this shopping checklist?')) return;
    try {
      await smartBasketService.deleteShoppingList(listId);
      setLists(prev => prev.filter(l => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#164B3A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#DDF3E7] text-[#164B3A] inline-block mb-1">
            Shopping Checklists
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17201C] tracking-tight">
            My Shopping Lists
          </h1>
          <p className="text-xs text-[#5A6561] font-semibold">
            Reopen, track and check off grocery items while shopping in store.
          </p>
        </div>

        <button
          onClick={() => onNavigate('smart_basket')}
          className="px-5 py-3 rounded-[16px] text-xs font-black bg-[#164B3A] text-white hover:bg-[#0F3629] flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#DDF3E7]" />
          Plan New Smart Basket
        </button>
      </div>

      {isOffline && (
        <div className="p-3 rounded-[14px] bg-[#FEF2F2] border border-[#E8785D]/30 text-xs font-bold text-[#E8785D] flex items-center gap-2">
          <span>⚡ Offline Mode: Working from local device cache. Checkbox updates are saved locally and will sync when reconnected.</span>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="card-fresh p-12 text-center space-y-4 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#164B3A]/30" />
          <h3 className="text-base font-black text-[#17201C]">No Saved Checklists Yet</h3>
          <p className="text-xs text-[#5A6561] font-semibold">
            Use the Smart Basket planner to personalize Indian staples and save your first shopping checklist!
          </p>
          <button
            onClick={() => onNavigate('smart_basket')}
            className="px-5 py-2.5 rounded-[14px] text-xs font-black bg-[#164B3A] text-white hover:bg-[#0F3629]"
          >
            Create a Shopping Plan Now
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          
          {/* Lists Overview Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#5A6561] px-1">
              Saved Lists ({lists.length})
            </h3>
            {lists.map(l => {
              const isSelected = selectedList?.id === l.id;
              const purchased = l.items?.filter(i => i.is_purchased).length || 0;
              const total = l.items?.length || 0;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedList(l)}
                  className={`card-fresh p-4 cursor-pointer transition-all border ${
                    isSelected 
                      ? 'border-2 border-[#164B3A] bg-[#DDF3E7]/30 shadow-xs' 
                      : 'border-[#E5E9E6] hover:border-[#164B3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-xs text-[#17201C] truncate">{l.title}</h4>
                    <span className="text-[10px] font-bold text-[#164B3A]">₹{l.total_estimated_cost_inr}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#5A6561] font-semibold">
                    <span>{purchased} / {total} purchased</span>
                    <span className="capitalize">{l.shopping_duration}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Checklist Details */}
          {selectedList && (
            <div className="md:col-span-2 space-y-4">
              <div className="card-fresh p-6 space-y-4">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E9E6] pb-4">
                  <div>
                    <h2 className="text-lg font-black text-[#17201C]">{selectedList.title}</h2>
                    <p className="text-xs text-[#5A6561] font-medium">
                      Budget: ₹{selectedList.budget_inr} • Est. Cost: ₹{selectedList.total_estimated_cost_inr}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteList(selectedList.id)}
                    className="p-2 rounded-xl text-[#5A6561] hover:text-[#E8785D] hover:bg-[#FEF2F2] transition-colors"
                    title="Delete list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  {selectedList.items?.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-[16px] border border-[#E5E9E6] transition-all flex items-center justify-between gap-3 ${
                        item.is_purchased ? 'bg-[#F8F8F4] opacity-60 border-dashed' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => item.id && handleToggleItem(selectedList.id, item.id, item.is_purchased)}
                          className="text-[#164B3A]"
                        >
                          {item.is_purchased ? (
                            <CheckSquare className="w-5 h-5 text-[#164B3A]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#5A6561]" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4 className={`text-xs font-black truncate ${item.is_purchased ? 'line-through text-[#5A6561]' : 'text-[#17201C]'}`}>
                            {item.name} {item.hindi_name && `(${item.hindi_name})`}
                          </h4>
                          <p className="text-[10px] text-[#5A6561] font-medium">
                            Qty: {item.quantity} • {item.pack_size}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#17201C] block">
                          ₹{item.estimated_price_inr * item.quantity}
                        </span>
                        <span className="text-[9px] font-bold text-[#5A6561]">
                          @ ₹{item.estimated_price_inr}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
