/**
 * Relatorios — Página principal de geração de relatórios
 *
 * ─── COMO INTEGRAR EM PRODUÇÃO ──────────────────────────────────────────────
 *
 *  1. ROLE DO UTILIZADOR
 *     Substituir MOCK_USER_ROLE pela role real do utilizador autenticado:
 *
 *       import { base44 } from "@/api/base44Client";
 *       const user = await base44.auth.me();
 *       // user.role será "admin" ou "encarregado" (conforme a entidade User)
 *
 *  2. LISTA DE OBRAS
 *     Substituir MOCK_OBRAS pela lista real, via getObras() de lib/dataProviders.js:
 *
 *       import { getObras } from "@/lib/dataProviders";
 *       const obras = await getObras();
 *       // Se o utilizador for encarregado, filtrar apenas as obras da sua responsabilidade.
 *
 *  3. DADOS DOS RELATÓRIOS
 *     Todos os dados dos templates são fornecidos por lib/dataProviders.js.
 *     Para produção, editar apenas esse ficheiro (cada função tem um TODO claro).
 *     Basta mudar USE_MOCK = false e implementar as chamadas reais.
 *
 *  4. EXPORT (Download)
 *     Cada Flow tem um handleExport() com TODO comentado.
 *     Criar uma backend function por tipo de relatório que recebe os filtros
 *     e devolve um fileUrl (Excel ou PDF gerado no servidor).
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { FileBarChart, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EncarregadoFlow from "../components/reports/EncarregadoFlow";
import AdminFlow from "../components/reports/AdminFlow";
import ProfileTabs from "../components/reports/ProfileTabs";
import { getObras } from "@/lib/dataProviders";

export default function Relatorios() {
  /**
   * TODO: PRODUÇÃO — obter role real do utilizador:
   *
   * import { base44 } from "@/api/base44Client";
   * const [userRole, setUserRole] = useState(null);
   * useEffect(() => {
   *   base44.auth.me().then(user => setUserRole(user.role));
   * }, []);
   */
  const [userRole] = useState("admin"); // "admin" | "encarregado"
  const isAdmin = userRole === "admin";

  const [activeView, setActiveView] = useState(isAdmin ? "admin" : "encarregado");
  const [obras, setObras] = useState([]);

  // Carregar lista de obras (mock ou real via dataProviders)
  useEffect(() => {
    getObras().then(setObras);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Relatórios e Exportação
              </h1>
              <p className="text-xs text-muted-foreground">
                Selecione, configure e exporte num único passo.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs admin/encarregado (apenas admin vê) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <ProfileTabs activeTab={activeView} onTabChange={setActiveView} />
          </motion.div>
        )}

        {/* Link discreto para gerir modelos — admin */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Settings2 className="w-3.5 h-3.5" />
              Gerir modelos de exportação
            </button>
          </motion.div>
        )}

        {/* Conteúdo do flow */}
        <AnimatePresence mode="wait">
          {activeView === "encarregado" ? (
            <motion.div
              key="encarregado"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <EncarregadoFlow obras={obras} />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AdminFlow
                showEncarregadoReports={isAdmin}
                onSwitchToEncarregado={() => setActiveView("encarregado")}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}