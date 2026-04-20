import React from 'react';
import { motion } from 'framer-motion';
import { HardHat, ArrowRight } from 'lucide-react';

const WorksiteList = ({ worksites, onSelectWorksite }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {worksites.map((worksite, index) => (
        <motion.div
          key={worksite.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.03 }}
        >
          <button
            onClick={() => onSelectWorksite(worksite)}
            className="w-full text-left bg-secondary p-4 rounded-lg shadow-md hover:bg-secondary/80 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <HardHat className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">{worksite.nome}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default WorksiteList;