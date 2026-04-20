import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LayoutDashboard, History, Car, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Import sub-pages
import RegisterFleetUsagePage from '@/pages/RegisterFleetUsagePage';
import FleetAdminDashboardPage from '@/pages/FleetAdminDashboardPage';
import FleetHistoryPage from '@/pages/FleetHistoryPage';

const FleetManagementPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'register', label: 'Registar Utilização', icon: Car },
    { id: 'dashboard', label: 'Painel Administrativo', icon: LayoutDashboard },
    { id: 'history', label: 'Histórico de Registos', icon: History },
  ];

  // Helper component for Navigation Button to ensure consistency across pages
  const NavButton = ({ item, onClick }) => (
    <Button
      variant={activeTab === item.id ? 'secondary' : 'ghost'}
      className={cn(
        "w-full justify-start gap-3 px-4 font-medium transition-colors",
        activeTab === item.id 
          ? "bg-secondary text-primary shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Button>
  );

  return (
    <>
      <Helmet>
        <title>Gestão de Frotas | Manteivias</title>
        <meta name="description" content="Gestão centralizada de frotas e equipamentos." />
      </Helmet>
      
      <div className="container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* Mobile Navigation Header */}
        <div className="md:hidden flex flex-col space-y-4 w-full">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/admin/management')} className="pl-0 hover:bg-transparent hover:text-primary">
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Voltar
                </Button>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] sm:w-[350px]">
                        <div className="flex flex-col space-y-2 mt-8">
                             {navItems.map((item) => (
                                <NavButton 
                                  key={item.id} 
                                  item={item} 
                                  onClick={() => {
                                      setActiveTab(item.id);
                                      setIsMobileMenuOpen(false);
                                  }}
                                />
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Frotas</h1>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
            <Button variant="ghost" onClick={() => navigate('/admin/management')} className="w-fit pl-4 hover:bg-transparent hover:text-primary mb-4">
                <ChevronLeft className="mr-2 h-5 w-5" />
                Voltar
            </Button>
            
            <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight px-4 mb-4">Frotas</h2>
                {navItems.map((item) => (
                    <NavButton 
                      key={item.id} 
                      item={item} 
                      onClick={() => setActiveTab(item.id)}
                    />
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
             <div className="hidden md:block mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Frotas</h1>
                <p className="text-muted-foreground text-lg mt-1">Gestão centralizada de frotas e equipamentos.</p>
             </div>
             
             <div className="w-full">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'register' && <RegisterFleetUsagePage isTab={true} />}
                    {activeTab === 'dashboard' && <FleetAdminDashboardPage isTab={true} />}
                    {activeTab === 'history' && <FleetHistoryPage isTab={true} />}
                </motion.div>
            </div>
        </div>
      </div>
    </>
  );
};

export default FleetManagementPage;