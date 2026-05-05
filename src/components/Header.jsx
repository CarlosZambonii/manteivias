import React, { useState } from 'react';
import { LogOut, KeyRound, Bell, FileText, ArrowRight, ScrollText, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChangePasswordDialog from './ChangePasswordDialog';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';
import { useCentralNotifications } from '@/hooks/useCentralNotifications';

const Header = () => {
  const { user, logout, isAdmin, isAdminStar } = useAuth();
  const { hasPermission } = useAdminPermissions();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { items: centralItems, unreadCount, markSeen } = useCentralNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = name => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };
  
  const handleLogoClick = () => {
    if (isAdmin) {
      navigate('/admin/management');
    } else {
      navigate('/');
    }
  };
  
  if (!user) return null;

  const canViewValidations = isAdmin && hasPermission('can_view_validations');
  const canViewFleets = isAdmin && hasPermission('can_view_fleets');
  const canViewOrganizational = isAdmin && hasPermission('can_view_organizational');
  const canViewDataAnalysis = isAdmin && hasPermission('can_view_data_analysis');

  return (
    <>
      <motion.header 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5 }} 
        className="bg-secondary/80 backdrop-blur-sm shadow-lg relative border-b-2 border-primary/50 z-20"
      >
        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-5" style={{
          backgroundImage: "url('https://storage.googleapis.com/hostinger-horizons-assets-prod/d062604b-d8fe-416f-a25d-71de29bc3dc0/f13d8edf2dc7030582ee4efa24111052.png')"
        }}></div>
        <div className="container mx-auto flex items-center justify-between p-4 relative z-10">
          <button onClick={handleLogoClick} className="flex items-center gap-4 cursor-pointer">
            <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/d062604b-d8fe-416f-a25d-71de29bc3dc0/a445b8a745a1d79fa57a195f52fac4b4.png" alt="Manteivias Logo" className="h-16 object-contain" />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            
            <LanguageSelector />

            <DropdownMenu onOpenChange={(open) => { if (open) markSeen(); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-foreground/80 hover:text-foreground transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Atualizações</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {centralItems.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    Nenhum item ainda.
                  </div>
                ) : (
                  centralItems.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer"
                      onSelect={() => navigate('/updates')}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-md ${item.meta.bg} flex items-center justify-center`}>
                        <FileText className={`w-3.5 h-3.5 ${item.meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold ${item.meta.color}`}>{item.meta.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.code}</span>
                        </div>
                        <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                      </div>
                      {item.isNew && (
                        <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary cursor-pointer"
                  onSelect={() => navigate('/updates')}
                >
                  Acessar Central de Atualizações
                  <ArrowRight className="w-3.5 h-3.5" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="text-right hidden sm:block">
              <p className="font-semibold text-foreground">{user.nome}</p>
              <p className="text-sm text-muted-foreground">{user.nif}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={user.avatar_url} alt={user.nome} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(user.nome)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-md font-medium leading-none">{user.nome}</p>
                    <p className="text-sm leading-none text-muted-foreground">
                      {user.funcao}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground pt-1">
                      NIF: {user.nif}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canViewValidations && <DropdownMenuItem onSelect={() => navigate('/admin/validacoes')}>Validações</DropdownMenuItem>}
                {canViewFleets && <DropdownMenuItem onSelect={() => navigate('/admin/frotas')}>Frotas</DropdownMenuItem>}
                {canViewOrganizational && <DropdownMenuItem onSelect={() => navigate('/admin/organizacional')}>Organizacional</DropdownMenuItem>}
                {canViewDataAnalysis && <DropdownMenuItem onSelect={() => navigate('/admin/analise-dados')}>Análise de Dados</DropdownMenuItem>}
                {isAdminStar && (
                  <DropdownMenuItem onSelect={() => navigate('/admin/logs')} className="gap-2">
                    <ScrollText className="w-4 h-4" />
                    Central de Logs
                  </DropdownMenuItem>
                )}
                {isAdminStar && (
                  <DropdownMenuItem onSelect={() => navigate('/test-panel')} className="gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Painel de Testes
                  </DropdownMenuItem>
                )}
                {(canViewValidations || canViewFleets || canViewOrganizational || canViewDataAnalysis || isAdminStar) && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>{t('auth.changePassword')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </>
  );
};
export default Header;