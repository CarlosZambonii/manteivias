import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MenuItemWithSubmenu = ({ 
  item, 
  depth = 0, 
  activeItem, 
  expandedItems, 
  onToggleExpand, 
  onSelect 
}) => {
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isExpanded = expandedItems.includes(item.id);
  const isActive = activeItem === item.id;
  const isChildActive = hasSubmenu && item.submenu.some(child => child.id === activeItem);

  const handleClick = () => {
    if (hasSubmenu) {
      onToggleExpand(item.id);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between px-4 py-2 font-medium transition-all duration-200",
          isActive || (hasSubmenu && isChildActive)
            ? "bg-secondary text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          depth > 0 && "pl-8 text-sm"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon className={cn("h-4 w-4", depth === 0 ? "h-5 w-5" : "")} />}
          <span>{item.label}</span>
        </div>
        {hasSubmenu && (
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </Button>

      <AnimatePresence>
        {hasSubmenu && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 py-1">
              {item.submenu.map((subItem) => (
                <MenuItemWithSubmenu
                  key={subItem.id}
                  item={subItem}
                  depth={depth + 1}
                  activeItem={activeItem}
                  expandedItems={expandedItems}
                  onToggleExpand={onToggleExpand}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuItemWithSubmenu;