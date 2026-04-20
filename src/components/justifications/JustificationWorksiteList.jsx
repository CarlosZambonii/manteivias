import React from 'react';
import { motion } from 'framer-motion';
import { HardHat, ArrowRight } from 'lucide-react';

const JustificationWorksiteList = ({ worksites, onSelectWorksite }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {worksites.map(worksite => (
            <motion.div key={worksite.id} whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
              <button onClick={() => onSelectWorksite(worksite)} className="w-full text-left bg-card p-4 rounded-lg shadow-md hover:bg-accent transition-colors flex items-center justify-between border">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-full">
                    <HardHat className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{worksite.nome}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </div>
    </>
  );
};

export default JustificationWorksiteList;