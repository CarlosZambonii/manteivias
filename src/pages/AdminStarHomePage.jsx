import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, DollarSign, Clock, BarChart2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import { useToast } from "@/components/ui/use-toast";

const AdminStarHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
    } else {
      toast({
        title: '🚧 Funcionalidade em desenvolvimento!',
        description: 'Esta área estará disponível em breve. Continue a acompanhar as novidades!',
        variant: 'default',
      });
    }
  };

  const menuItems = [
    { title: 'Área Stock', icon: Package, path: null, permission: user?.area_stock },
    { title: 'Área Frota', icon: Truck, path: null, permission: user?.area_frota },
    { title: 'Área Financeira', icon: DollarSign, path: null, permission: user?.area_financeira },
    { title: 'Área Registo de Pontos', icon: Clock, path: '/admin/home', permission: user?.area_regis_ponto },
    { title: 'Área Análise de Dados', icon: BarChart2, path: null, permission: user?.area_dados },
    { title: 'Área Organizacional', icon: Briefcase, path: null, permission: user?.area_organizacional },
  ];

  const buttonClass = "w-full h-40 p-4 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-primary via-blue-600 to-sky-500 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-1 shadow-lg rounded-2xl border border-border/20";
  const disabledButtonClass = "w-full h-40 p-4 flex flex-col justify-center items-center text-center text-muted-foreground bg-card/50 backdrop-blur-sm shadow-md rounded-2xl border border-border/20 cursor-not-allowed opacity-60";
  
  return (
    <>
      <Helmet>
        <title>Painel Principal</title>
        <meta name="description" content="Painel de controlo para administradores de topo." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 md:p-6"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Painel de Gestão Estratégica</h1>
          <p className="text-muted-foreground text-lg mt-2">Bem-vindo, {user?.nome || 'Administrador'}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                className={item.permission ? buttonClass : disabledButtonClass}
                onClick={() => item.permission && handleNavigation(item.path)}
                disabled={!item.permission}
              >
                <item.icon className="h-10 w-10 mb-3" />
                <p className="font-semibold text-lg">{item.title}</p>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default AdminStarHomePage;