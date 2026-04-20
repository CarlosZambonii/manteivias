import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Users, 
  Menu, 
  ClipboardCheck, 
  CalendarDays, 
  FileText, 
  Wrench,
  Plane,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from '@/lib/customSupabaseClient';

import RecordsValidationTab from '@/components/validation/RecordsValidationTab';
import JustificationsValidationTab from '@/components/validation/JustificationsValidationTab';
import CorrectionsValidationTab from '@/components/validation/CorrectionsValidationTab';
import MonthlyValidationTab from '@/components/validation/MonthlyValidationTab';
import SubcontractorValidationTab from '@/components/validation/SubcontractorValidationTab';
import MonthlyCorrectionsValidationTab from '@/components/validation/MonthlyCorrectionsValidationTab';
import HolidaysValidationTab from '@/components/validation/HolidaysValidationTab';
import CascadingMenu from '@/components/ui/CascadingMenu';

const AdminValidationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = useAdminPermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allowedWorksites, setAllowedWorksites] = useState(undefined);
  
  useEffect(() => {
    const fetchWorksites = async () => {
        if (!user) return;
        
        if (user.tipo_usuario === 'admin_star') {
            setAllowedWorksites(null); // null means NO filtering, allowed to see ALL worksites
        } else if (user.tipo_usuario === 'admin') {
            // Specific filter for encarregados / regular admins mapped to worksites
            const { data } = await supabase.from('obras').select('id').eq('encarregado_id', user.id);
            setAllowedWorksites(data ? data.map(o => o.id) : []);
        } else {
            // Default fallback for other roles
            setAllowedWorksites(null); 
        }
    };
    
    fetchWorksites();
  }, [user]);

  const menuItems = useMemo(() => {
    const items = [];

    // Daily Section
    const dailySubmenu = [];
    if (hasPermission('can_validate_daily_records')) dailySubmenu.push({ id: 'records', label: 'Registos', icon: ClipboardCheck });
    if (hasPermission('can_validate_daily_corrections')) dailySubmenu.push({ id: 'corrections-daily', label: 'Correções', icon: Wrench });
    if (hasPermission('can_validate_daily_justifications')) dailySubmenu.push({ id: 'justifications', label: 'Justificações', icon: FileText });
    
    if (dailySubmenu.length > 0) {
      items.push({ id: 'section-daily', label: 'Diário', icon: CalendarDays, submenu: dailySubmenu });
    }

    // Monthly Section
    const monthlySubmenu = [];
    if (hasPermission('can_validate_monthly_records')) monthlySubmenu.push({ id: 'monthly-records', label: 'Registos', icon: ClipboardCheck });
    if (hasPermission('can_validate_holidays')) monthlySubmenu.push({ id: 'holidays', label: 'Férias', icon: Plane });
    if (hasPermission('can_validate_monthly_corrections')) monthlySubmenu.push({ id: 'corrections-monthly', label: 'Correções', icon: Wrench });

    if (monthlySubmenu.length > 0) {
      items.push({ id: 'section-monthly', label: 'Mensal', icon: Calendar, submenu: monthlySubmenu });
    }

    // Subcontractors Section
    if (hasAnyPermission(['can_manage_subcontractor_docs', 'can_register_subcontractor_records'])) {
        items.push({ id: 'subcontractors', label: 'Subempreiteiros', icon: Users, submenu: [] });
    }

    return items;
  }, [hasPermission, hasAnyPermission]);

  const getInitialTab = () => {
    if (menuItems.length > 0) {
        const firstItem = menuItems[0];
        return firstItem.submenu && firstItem.submenu.length > 0 ? firstItem.submenu[0].id : firstItem.id;
    }
    return '';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  if (allowedWorksites === undefined) {
      return (
         <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'records': return hasPermission('can_validate_daily_records') ? <RecordsValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'corrections-daily': return hasPermission('can_validate_daily_corrections') ? <CorrectionsValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'justifications': return hasPermission('can_validate_daily_justifications') ? <JustificationsValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'monthly-records': return hasPermission('can_validate_monthly_records') ? <MonthlyValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'holidays': return hasPermission('can_validate_holidays') ? <HolidaysValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'corrections-monthly': return hasPermission('can_validate_monthly_corrections') ? <MonthlyCorrectionsValidationTab worksiteFilter={allowedWorksites} /> : null;
      case 'subcontractors': return hasAnyPermission(['can_manage_subcontractor_docs', 'can_register_subcontractor_records']) ? <SubcontractorValidationTab worksiteFilter={allowedWorksites} /> : null;
      default: return <div className="p-8 text-center text-muted-foreground">Selecione uma opção do menu, ou não tem permissão para ver esta secção.</div>;
    }
  };

  const getPageTitle = () => {
    for (const group of menuItems) {
      if (group.id === activeTab) return group.label;
      if (group.submenu) {
        const item = group.submenu.find(i => i.id === activeTab);
        if (item) return `${group.label} - ${item.label}`;
      }
    }
    return 'Central de Validações';
  };

  return (
    <>
      <Helmet>
        <title>Central de Validações | Manteivias</title>
        <meta name="description" content="Página para validar registos, justificações e correções." />
      </Helmet>
      
      <div className="container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-4rem)]">
        <div className="md:hidden flex flex-col space-y-4 w-full">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/admin/management')} className="pl-0 hover:bg-transparent hover:text-primary"><ChevronLeft className="mr-2 h-5 w-5" />Voltar</Button>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                    <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
                        <div className="flex flex-col space-y-2 mt-8 px-4">
                            <h2 className="text-lg font-semibold mb-4 px-2">Navegação</h2>
                            <CascadingMenu items={menuItems} activeItem={activeTab} onSelect={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <h1 className="text-2xl font-bold tracking-tight truncate">{getPageTitle()}</h1>
        </div>
        <div className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
            <Button variant="ghost" onClick={() => navigate('/admin/management')} className="w-fit pl-2 hover:bg-transparent hover:text-primary mb-2"><ChevronLeft className="mr-2 h-5 w-5" />Voltar</Button>
            <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight px-4 mb-4">Validações</h2>
                <CascadingMenu items={menuItems} activeItem={activeTab} onSelect={setActiveTab} />
            </div>
        </div>
        <div className="flex-1 w-full min-w-0">
             <div className="hidden md:block mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Central de Validações</h1>
                <p className="text-muted-foreground text-lg mt-1">Aprove ou rejeite as pendências dos colaboradores e subempreiteiros.</p>
             </div>
             <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg min-h-[500px]">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {renderContent()}
                </motion.div>
            </div>
        </div>
      </div>
    </>
  );
};
export default AdminValidationPage;