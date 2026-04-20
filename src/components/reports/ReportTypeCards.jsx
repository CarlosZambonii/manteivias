import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportTypeCards({ options, value, onChange }) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const isSelected = value === option.id;
        const IconComponent = option.icon;

        return (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
              isSelected
                ? "border-primary bg-accent/60 shadow-md"
                : "border-border/60 bg-card hover:border-primary/30 hover:bg-accent/20"
            )}
          >
            <div className="flex items-start gap-3">
              {IconComponent && (
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  <IconComponent className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-semibold text-sm",
                    isSelected ? "text-foreground" : "text-foreground/80"
                  )}>
                    {option.label}
                  </h4>
                  {isSelected && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
