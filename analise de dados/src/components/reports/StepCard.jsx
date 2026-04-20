import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StepCard({ 
  stepNumber, 
  title, 
  description, 
  icon: Icon, 
  isActive, 
  isCompleted, 
  isDisabled, 
  children 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: stepNumber * 0.08 }}
      className={cn(
        "rounded-xl border transition-all duration-300",
        isActive && "border-primary/40 bg-card shadow-lg shadow-primary/5",
        isCompleted && !isActive && "border-success/30 bg-card/80",
        isDisabled && "border-border/50 bg-muted/30 opacity-50 pointer-events-none",
        !isActive && !isCompleted && !isDisabled && "border-border bg-card/60"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors shrink-0",
          isCompleted ? "bg-success text-success-foreground" : 
          isActive ? "bg-primary text-primary-foreground" : 
          "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn(
              "w-4 h-4 shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />}
            <h3 className={cn(
              "font-semibold text-sm",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {(isActive || isCompleted) && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}