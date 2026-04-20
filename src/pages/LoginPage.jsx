import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from '@/hooks/useLanguage';

const LoginPage = () => {
  const { t } = useLanguage();
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(nif, password);
      
      if (user) {
        toast({
          title: t('auth.loginSuccess') || "Sucesso",
          description: `${t('auth.welcome') || "Bem-vindo"}, ${user.nome.split(' ')[0]}!`
        });
        const userType = user.tipo_usuario?.toLowerCase();
        if (userType === 'admin_star' || userType === 'admin') {
          navigate('/admin/management');
        } else {
          navigate('/');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro de Autenticação",
          description: "Credenciais inválidas. Verifique o NIF e a palavra-passe."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Credenciais inválidas. Verifique o NIF e a palavra-passe."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.loginTitle')}</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0"></div>
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse delay-500"></div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="w-full max-w-md z-10">
          <div className="bg-card/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-border/50">
            <div className="text-center mb-8">
              <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/d062604b-d8fe-416f-a25d-71de29bc3dc0/a445b8a745a1d79fa57a195f52fac4b4.png" alt="Manteivias Logo" className="w-48 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground">{t('auth.loginTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-2">{t('auth.loginSubtitle')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nif">{t('auth.nifLabel')}</Label>
                <Input 
                  id="nif" 
                  type="text" 
                  value={nif} 
                  onChange={e => setNif(e.target.value)} 
                  placeholder={t('auth.nifPlaceholder')} 
                  required 
                  className="bg-background/50 text-foreground" 
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder={t('auth.passwordPlaceholder')} 
                  required 
                  className="bg-background/50 pr-10 text-foreground" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Button 
                type="submit" 
                className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : t('auth.loginButton')}
              </Button>
            </form>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-6">
            © {new Date().getFullYear()} Manteivias. {t('auth.rights')}
          </p>
        </motion.div>
      </div>
    </>
  );
};
export default LoginPage;