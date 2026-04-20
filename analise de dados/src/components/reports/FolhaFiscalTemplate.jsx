import { useMemo } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mesNumero(mes) {
  const map = {
    janeiro:1,fevereiro:2,marco:3,março:3,abril:4,maio:5,junho:6,
    julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12,
  };
  return map[(mes||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")] || 1;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay(); // 0=Dom, 6=Sab
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_LABELS = {
  1: "Segunda Feira",
  2: "Terça Feira",
  3: "Quarta Feira",
  4: "Quinta Feira",
  5: "Sexta Feira",
};

// ─── Estilos base ─────────────────────────────────────────────────────────────
const CELL = {
  border: "1px solid #9FA8B4",
  padding: "1px 3px",
  fontSize: 8,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  textAlign: "center",
  lineHeight: "14px",
};

const TH_DARK = { ...CELL, backgroundColor: "#1F3864", color: "#FFFFFF", fontWeight: "700" };
const TH_WEEK = { ...CELL, backgroundColor: "#1F3864", color: "#FFFFFF", fontWeight: "700", fontSize: 8 };
const TH_SUB  = { ...CELL, backgroundColor: "#2E74B5", color: "#FFFFFF", fontWeight: "700", fontSize: 7 };
const TH_SAB  = { ...CELL, backgroundColor: "#C55A11", color: "#FFFFFF", fontWeight: "700", fontSize: 7 };
const TD_NORM = { ...CELL, backgroundColor: "#FFFFFF", color: "#1a1a1a" };
const TD_ALT  = { ...CELL, backgroundColor: "#FCE4D6", color: "#1a1a1a" }; // laranja claro como Excel com AV

// ─── Componente ───────────────────────────────────────────────────────────────
export default function FolhaFiscalTemplate({ data, showAv = false }) {
  const { mes, ano, obra, empresa = "Manteivias", colaboradores, registos } = data;

  const mesNum    = useMemo(() => mesNumero(mes), [mes]);
  const daysCount = useMemo(() => getDaysInMonth(ano, mesNum), [ano, mesNum]);

  // Agrupar dias por semana: cada semana tem dias 1-5 (Seg-Sex)
  // Construir lista de semanas: cada semana é um array de {day, dow}
  const weeks = useMemo(() => {
    const result = [];
    let current = [];
    for (let d = 1; d <= daysCount; d++) {
      const dow = getDayOfWeek(ano, mesNum, d);
      if (dow === 1 && current.length > 0) {
        result.push(current);
        current = [];
      }
      current.push({ day: d, dow });
    }
    if (current.length > 0) result.push(current);
    return result;
  }, [ano, mesNum, daysCount]);

  // Indexar registos: { colaboradorId: { dia: { manha, tarde, av } } }
  const registosMap = useMemo(() => {
    const map = {};
    (registos || []).forEach(({ colaborador_id, dia, manha, tarde, av }) => {
      if (!map[colaborador_id]) map[colaborador_id] = {};
      map[colaborador_id][dia] = { manha: manha || "", tarde: tarde || "", av: av || "" };
    });
    return map;
  }, [registos]);

  // Período formatado
  const firstDay = `01/${String(mesNum).padStart(2, "0")}/${ano}`;
  const lastDay  = `${String(daysCount).padStart(2, "0")}/${String(mesNum).padStart(2, "0")}/${ano}`;
  const periodo  = `${firstDay} - ${lastDay}`;

  // Colunas de dias da semana para o header (Seg=1..Sex=5 + Sab=6 + Dom=0 se showAv)
  const weekdayOrder = showAv ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];

  // Contar colunas por dia: Manhã + Tarde [+ AV]
  const colsPerWeekday = showAv ? 3 : 2;

  return (
    <div style={{ fontFamily: "Calibri, Arial, sans-serif", background: "#fff", color: "#1a1a1a", fontSize: 8 }}>

      {/* ── Logo + Obra ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, borderBottom: "2px solid #1F3864", paddingBottom: 6 }}>
        <img
          src="https://media.base44.com/images/public/69c6b5e5129ab060bc75b134/531c44530_image.png"
          alt="Manteivias"
          style={{ height: 40, objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "700", fontSize: 11, color: "#1F3864" }}>{obra}</div>
        </div>
      </div>

      {/* ── Período ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6, backgroundColor: "#D9D9D9", padding: "3px 8px" }}>
        <div style={{ fontWeight: "600", fontSize: 9, color: "#1F3864" }}>{periodo}</div>
      </div>

      {/* ── Título do relatório ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 4, fontWeight: "700", fontSize: 10, color: "#1F3864", textAlign: "center" }}>
        FOLHA FISCAL — {showAv ? "COM AV" : "SEM AV"}
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "auto", width: "100%" }}>
          <thead>
            {/* Linha 1: Nome | Empresa | dias da semana agrupados */}
            <tr>
              <th style={{ ...TH_DARK, width: 130, textAlign: "left", paddingLeft: 4 }} rowSpan={2}>Nome</th>
              <th style={{ ...TH_DARK, width: 70 }} rowSpan={2}>Empresa</th>
              {weekdayOrder.map(dow => {
                if (dow === 6) return <th key={dow} style={TH_SAB} colSpan={showAv ? 1 : 1}>Sáb</th>;
                if (dow === 0) return <th key={dow} style={TH_SAB} colSpan={1}>Dom</th>;
                return (
                  <th key={dow} style={TH_WEEK} colSpan={colsPerWeekday}>
                    {WEEKDAY_LABELS[dow]}
                  </th>
                );
              })}
            </tr>
            {/* Linha 2: Manhã / Tarde [/ AV] por cada dia da semana */}
            <tr>
              {weekdayOrder.map(dow => {
                if (dow === 6 || dow === 0) {
                  return showAv ? <th key={dow} style={TH_SAB}>AV</th> : null;
                }
                return (
                  <>
                    <th key={`${dow}-m`} style={TH_SUB}>Manhã</th>
                    <th key={`${dow}-t`} style={{ ...TH_SUB, backgroundColor: "#2E74B5" }}>Tarde</th>
                    {showAv && <th key={`${dow}-av`} style={{ ...TH_SUB, backgroundColor: "#C55A11" }}>AV</th>}
                  </>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const regCol = registosMap[col.id] || {};
              const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F5F7FA";

              return (
                <tr key={col.id}>
                  {/* Nome */}
                  <td style={{ ...CELL, backgroundColor: rowBg, textAlign: "left", paddingLeft: 4, fontWeight: "500" }}>
                    {col.nome}
                  </td>
                  {/* Empresa */}
                  <td style={{ ...CELL, backgroundColor: rowBg }}>
                    {col.empresa || empresa}
                  </td>

                  {/* Dados por dia da semana */}
                  {weekdayOrder.map(dow => {
                    if (dow === 6 || dow === 0) {
                      if (!showAv) return null;
                      // Sab/Dom — coluna AV
                      // Encontrar o primeiro dia deste dow no mês para o mock
                      const dayEntry = Object.entries(regCol).find(([d]) => getDayOfWeek(ano, mesNum, parseInt(d)) === dow);
                      const av = dayEntry ? dayEntry[1].av : "";
                      return (
                        <td key={dow} style={{ ...CELL, backgroundColor: "#FCE4D6" }}>
                          {av}
                        </td>
                      );
                    }

                    // Semana: encontrar dias deste dow
                    const dayEntries = Object.entries(regCol).filter(([d]) => getDayOfWeek(ano, mesNum, parseInt(d)) === dow);
                    // Usar o primeiro encontrado (semana representativa)
                    const entry = dayEntries[0];
                    const manha = entry ? entry[1].manha : "";
                    const tarde = entry ? entry[1].tarde : "";
                    const av    = entry ? entry[1].av    : "";

                    return (
                      <>
                        <td key={`${dow}-m`} style={{ ...CELL, backgroundColor: rowBg }}>{manha}</td>
                        <td key={`${dow}-t`} style={{ ...CELL, backgroundColor: rowBg }}>{tarde}</td>
                        {showAv && <td key={`${dow}-av`} style={{ ...CELL, backgroundColor: "#FCE4D6" }}>{av}</td>}
                      </>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>
    </div>
  );
}