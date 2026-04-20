import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthText = ['Muito Fraca', 'Fraca', 'Razoável', 'Forte', 'Muito Forte', 'Excelente'][strength];
  const color = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-green-500'][strength];

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
      </div>
      <span className="text-xs text-muted-foreground w-24 text-right">{strengthText}</span>
    </div>
  );
};

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erro', description: 'As novas senhas não coincidem.' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A nova senha deve ter pelo menos 8 caracteres.' });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke('update-password', {
        body: { userId: user.id, currentPassword, newPassword },
    });

    setIsLoading(false);

    if (error || data?.error) {
        toast({
            variant: "destructive",
            title: "Erro ao alterar a senha",
            description: error?.message || data?.error,
        });
        return;
    }
    
    updateUser({ senha_trocada: true });
    toast({ title: '✅ Sucesso', description: 'Sua senha foi alterada com sucesso.' });
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Lock className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-white mt-4">Alteração de Senha Obrigatória</h1>
          <p className="text-muted-foreground">Por segurança, por favor, altere sua senha.</p>
        </div>
        <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-foreground mb-2">Senha Atual</label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Sua senha atual"
                  className="h-12 text-base pr-10 border-2 border-input focus:border-primary"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors">
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 text-base pr-10 border-2 border-input focus:border-primary"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors">
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Repita a nova senha"
                  className="h-12 text-base pr-10 border-2 border-input focus:border-primary"
                />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
              {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div> : <><KeyRound className="mr-2 h-5 w-5" />Alterar Senha</>}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;