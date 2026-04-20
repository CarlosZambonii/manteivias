import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart2, Briefcase, CheckSquare, Truck, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const AdminManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = useAdminPermissions();
  const { t } = useLanguage();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const menuItems = [
    { title: t('admin.clockIn'), icon: Clock, path: '/', permission: true },
    { title: t('admin.validations'), icon: CheckSquare, path: '/admin/validacoes', permission: hasPermission('can_view_validations') },
    { title: t('admin.analysis'), icon: BarChart2, path: '/admin/analise-dados', permission: hasPermission('can_view_data_analysis') },
    { title: t('admin.orgArea'), icon: Briefcase, path: '/admin/organizacional', permission: hasPermission('can_view_organizational') },
    { title: t('admin.fleets'), icon: Truck, path: '/admin/frotas', permission: hasPermission('can_view_fleets') },
  ];

  const renderButton = (item) => {
    const buttonContent = (
      <Button
        className={cn(
          "w-full h-40 p-4 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-primary via-blue-600 to-sky-500 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-1 shadow-lg rounded-2xl border border-border/20",
          !item.permission && "from-gray-400 via-gray-500 to-gray-600 cursor-not-allowed hover:shadow-none hover:-translate-y-0"
        )}
        onClick={() => item.permission && handleNavigation(item.path)}
        disabled={!item.permission}
      >
        {item.permission ? <item.icon className="h-10 w-10 mb-3" /> : <Ban className="h-10 w-10 mb-3" />}
        <p className="font-semibold text-lg">{item.title}</p>
      </Button>
    );

    if (item.permission) {
      return buttonContent;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>Não tem permissão para aceder a esta área.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>{t('admin.title')}</title>
        <meta name="description" content="Painel de controlo para administradores." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 md:p-6"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('admin.title')}</h1>
          <p className="text-muted-foreground text-lg mt-2">{t('admin.welcome')}, {user?.nome || 'Administrador'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {renderButton(item)}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default AdminManagementPage;