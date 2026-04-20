import React, { useState, useEffect } from 'react';
import MenuItemWithSubmenu from './MenuItemWithSubmenu';
import { cn } from '@/lib/utils';

const CascadingMenu = ({ items, activeItem, onSelect, className }) => {
  const [expandedItems, setExpandedItems] = useState([]);

  // Auto-expand the parent of the active item on mount or change
  useEffect(() => {
    const parent = items.find(item => 
      item.submenu && item.submenu.some(child => child.id === activeItem)
    );
    if (parent && !expandedItems.includes(parent.id)) {
      setExpandedItems(prev => [...prev, parent.id]);
    }
  }, [activeItem, items]);

  const handleToggleExpand = (id) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className={cn("flex flex-col space-y-1 w-full", className)}>
      {items.map((item) => (
        <MenuItemWithSubmenu
          key={item.id}
          item={item}
          activeItem={activeItem}
          expandedItems={expandedItems}
          onToggleExpand={handleToggleExpand}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default CascadingMenu;