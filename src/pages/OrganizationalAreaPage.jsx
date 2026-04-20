import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  HardHat, 
  FileText, 
  Menu,
  Briefcase,
  UserCog
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

// Import Management Components
import AdminUserManagementPage from '@/components/organizational/AdminUserManagementPage';
import AdminSubcontractorManagementPage from '@/components/organizational/AdminSubcontractorManagementPage';
import UserManagementReadOnlyPage from '@/components/organizational/UserManagementReadOnlyPage';
import WorksiteDataTable from '@/components/organizational/WorksiteDataTable';
import JustificationTypeDataTable from '@/components/organizational/JustificationTypeDataTable';

const OrganizationalAreaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminStar } = useAuth();
  const { hasAnyPermission } = useAdminPermissions();
  
  // Check specific permissions to conditionally show tabs
  const canManageUsers = isAdminStar || hasAnyPermission(['can_add_users', 'can_edit_users', 'can_delete_users', 'can_manage_users']);
  const canManageSubcontractors = isAdminStar || hasAnyPermission(['can_add_subcontractors', 'can_edit_subcontractors', 'can_delete_subcontractors', 'can_manage_subcontractors']);

  const navItems = useMemo(() => {
    const items = [];
    
    // Users Tab
    if (isAdminStar || canManageUsers) {
        items.push({ id: 'users', label: 'Gestão Utilizadores', icon: UserCog });
    } else {
        // Read-only view for those who can access organizational area but not manage users?
        // Or maybe just hide it. The original code showed ReadOnly page if NOT adminStar.
        // Let's keep the UserManagementReadOnlyPage accessible if they don't have manage permissions but can access this area.
        items.push({ id: 'users', label: 'Utilizadores', icon: UserCog });
    }

    // Subcontractors Tab
    if (isAdminStar || canManageSubcontractors) {
        items.push({ id: 'subcontractors', label: 'Subempreiteiros', icon: Briefcase });
    }

    // Common Tabs
    items.push(
        { id: 'worksites', label: 'Obras', icon: HardHat },
        { id: 'justificationTypes', label: 'Tipos de Justificação', icon: FileText }
    );
    
    return items;
  }, [isAdminStar, canManageUsers, canManageSubcontractors]);

  // Determine default tab
  const defaultTab = navItems[0]?.id || 'worksites';
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || defaultTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Validate active tab on mount and permission change
  useEffect(() => {
    const isValidTab = navItems.some(item => item.id === activeTab);
    if (!isValidTab && navItems.length > 0) {
      setActiveTab(navItems[0].id);
    }
  }, [navItems, activeTab]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (isAdminStar || canManageUsers) ? <AdminUserManagementPage /> : <UserManagementReadOnlyPage />;
      case 'subcontractors':
        return (isAdminStar || canManageSubcontractors) ? <AdminSubcontractorManagementPage /> : null;
      case 'worksites':
        return <WorksiteDataTable />;
      case 'justificationTypes':
        return <JustificationTypeDataTable />;
      default:
        return <WorksiteDataTable />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Área Organizacional | Manteivias</title>
        <meta name="description" content="Gerir utilizadores, obras e estrutura organizacional." />
      </Helmet>
      
      <div className="container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* Mobile Header & Navigation */}
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
                            <h3 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Menu
                            </h3>
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
            <h1 className="text-2xl font-bold tracking-tight">Área Organizacional</h1>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
            <Button variant="ghost" onClick={() => navigate('/admin/management')} className="w-fit pl-4 hover:bg-transparent hover:text-primary mb-4">
                <ChevronLeft className="mr-2 h-5 w-5" />
                Voltar
            </Button>
            
            <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight px-4 mb-4">Organização</h2>
                {navItems.map((item) => (
                    <NavButton 
                      key={item.id} 
                      item={item} 
                      onClick={() => setActiveTab(item.id)}
                    />
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
             <div className="hidden md:block mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Área Organizacional</h1>
                <p className="text-muted-foreground text-lg mt-1">
                  {activeTab === 'users' && 'Gestão de utilizadores internos da Manteivias.'}
                  {activeTab === 'subcontractors' && 'Gestão de subempreiteiros e parceiros.'}
                  {activeTab === 'worksites' && 'Gestão de obras e estaleiros.'}
                  {activeTab === 'justificationTypes' && 'Configuração de tipos de ausência.'}
                </p>
             </div>
             
             <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg min-h-[500px]">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationalAreaPage;