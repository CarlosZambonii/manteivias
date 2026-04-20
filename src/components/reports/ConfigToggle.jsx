import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ConfigToggle({ options, value, onChange, label, hint }) {
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}
      {hint && (
        <p className="text-xs text-muted-foreground -mt-1">{hint}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = value === option.id;
          return (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-center transition-all duration-200",
                isSelected
                  ? "border-primary bg-accent/60 shadow-md"
                  : "border-border/60 bg-card hover:border-primary/30"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <p className={cn(
                "text-sm font-semibold",
                isSelected ? "text-foreground" : "text-foreground/70"
              )}>
                {option.label}
              </p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
