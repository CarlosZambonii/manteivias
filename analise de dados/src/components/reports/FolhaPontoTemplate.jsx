import { useMemo } from "react";

// ─── Códigos → cor (fiel ao Excel Justificações) ──────────────────────────────
const CODE_STYLES = {
  "FE":  { bg: "#70AD47", color: "#FFFFFF", label: "Férias" },
  "BX":  { bg: "#00B0F0", color: "#FFFFFF", label: "Baixa" },
  "FJ":  { bg: "#FF0000", color: "#FFFFFF", label: "Falta justificada" },
  "FI":  { bg: "#FF7F00", color: "#FFFFFF", label: "Falta Injustificada" },
  "LP":  { bg: "#00B050", color: "#FFFFFF", label: "Licença Parental" },
  "LC":  { bg: "#FFFF00", color: "#333333", label: "Licença casamento" },
  "IP":  { bg: "#FFC000", color: "#FFFFFF", label: "Isolamento Profilático" },
  "AT":  { bg: "#FF0000", color: "#FFFFFF", label: "Baixa por acidente de trabalho" },
  "BX2": { bg: "#00B0F0", color: "#FFFFFF", label: "Férias trabalhadas e não gozadas- pagar" },
  "N":   { bg: "#7030A0", color: "#FFFFFF", label: "Nojo_Falec.de familiar" },
  "S":   { bg: "#FF0000", color: "#FFFFFF", label: "Saída da Empresa" },
  "E":   { bg: "#FFFF00", color: "#333333", label: "Entrada na Empresa" },
  "F":   { bg: "#FF7F00", color: "#FFFFFF", label: "Falta" },
};

function getCellStyle(code) {
  if (!code || !code.trim()) return {};
  const s = CODE_STYLES[code.trim().toUpperCase()];
  if (s) return { backgroundColor: s.bg, color: s.color };
  return {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function mesNumero(mes) {
  const map = {
    janeiro:1,fevereiro:2,marco:3,março:3,abril:4,maio:5,junho:6,
    julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12,
  };
  return map[(mes||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")] || 1;
}

function isWeekend(year, month, day) {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 || d === 6;
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const CELL = {
  border: "1px solid #9FA8B4",
  padding: "1px 2px",
  fontSize: 8,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  textAlign: "center",
  lineHeight: "13px",
};

function thDark(extra = {}) {
  return { ...CELL, backgroundColor: "#1F3864", color: "#4FC3F7", fontWeight: "700", ...extra };
}
function thMid(extra = {}) {
  return { ...CELL, backgroundColor: "#2E74B5", color: "#FFFFFF", fontWeight: "700", ...extra };
}
function tdBase(extra = {}) {
  return { ...CELL, backgroundColor: "#FFFFFF", color: "#1a1a1a", ...extra };
}
function tdWeekend(extra = {}) {
  return { ...CELL, backgroundColor: "#E8EEF5", color: "#888", ...extra };
}

// ─── Legenda ──────────────────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { code: "AT",  label: "Baixa por acidente de trabalho" },
  { code: "BX",  label: "Baixa" },
  { code: "BX2", label: "Férias trabalhadas e não gozadas- pagar" },
  { code: "FE",  label: "Férias" },
  { code: "FJ",  label: "Falta justificada" },
  { code: "FI",  label: "Falta Injustificada" },
  { code: "N",   label: "Nojo_Falec.de familiar" },
  { code: "S",   label: "Saída da Empresa" },
  { code: "E",   label: "Entrada na Empresa" },
  { code: "LP",  label: "Licença Parental" },
  { code: "LC",  label: "Licença casamento" },
  { code: "IP",  label: "Isolamento Profilático" },
];

function Legenda() {
  return (
    <div style={{ marginBottom: 10, border: "1px solid #BDBDBD", padding: "6px 10px", backgroundColor: "#FAFAFA" }}>
      <div style={{ fontWeight: "700", fontSize: 9, marginBottom: 5, textDecoration: "underline" }}>Legenda</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
        {LEGEND_ITEMS.map(({ code, label }) => {
          const s = CODE_STYLES[code] || {};
          return (
            <div key={code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 18, height: 11, backgroundColor: s.bg || "#EEE",
                border: "1px solid #999", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 6, fontWeight: "700", color: s.color || "#333",
              }}>
                {code === "BX2" ? "Bx" : code}
              </div>
              <span style={{ fontSize: 7.5, color: "#333", whiteSpace: "nowrap" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FolhaPontoTemplate({ data, showAv = false }) {
  const { mes, ano, obra, colaboradores, registos } = data;

  const mesNum    = useMemo(() => mesNumero(mes), [mes]);
  const daysCount = useMemo(() => getDaysInMonth(ano, mesNum), [ano, mesNum]);
  const days      = useMemo(() => Array.from({ length: daysCount }, (_, i) => i + 1), [daysCount]);

  const mesLabel  = (mes || "").charAt(0).toUpperCase() + (mes || "").slice(1).toUpperCase();
  const title     = `FOLHA DE PONTO_${ano}_${mesLabel}`;

  // Indexar registos: { colaboradorId: { dia: codigo } }
  const registosMap = useMemo(() => {
    const map = {};
    (registos || []).forEach(({ colaborador_id, dia, codigo, manha }) => {
      if (!map[colaborador_id]) map[colaborador_id] = {};
      // suporta campo "codigo" (estrutura antiga) ou "manha" (nova)
      map[colaborador_id][dia] = codigo || manha || "";
    });
    return map;
  }, [registos]);

  return (
    <div
      style={{
        fontFamily: "Calibri, Arial, sans-serif",
        background: "#fff",
        color: "#1a1a1a",
        fontSize: 8,
      }}
    >
      {/* ── Logo + Título ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, gap: 16, borderBottom: "2px solid #1F3864", paddingBottom: 8 }}>
        <img
          src="https://media.base44.com/images/public/69c6b5e5129ab060bc75b134/531c44530_image.png"
          alt="Manteivias"
          style={{ height: 44, objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "700", fontSize: 13, color: "#1F3864", letterSpacing: 1 }}>
            FOLHA DE PONTO — JUSTIFICAÇÕES
          </div>
          <div style={{ fontWeight: "500", fontSize: 10, color: "#2E74B5", marginTop: 2 }}>
            {(mes || "").toUpperCase()} {ano} · Todos os Colaboradores
          </div>
        </div>
      </div>

      {/* ── Legenda (horizontal, acima da tabela) ────────────────────── */}
      <Legenda />

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: 22 }} />   {/* Nº */}
            <col style={{ width: 160 }} />  {/* Nome */}
            <col style={{ width: 18 }} />   {/* F.J. */}
            <col style={{ width: 18 }} />   {/* S.A. */}
            <col style={{ width: 18 }} />   {/* F.I. */}
            {days.map(d => <col key={d} style={{ width: 18 }} />)}
          </colgroup>

          <thead>
            {/* Linha de colunas */}
            <tr>
              <th style={thDark({ width: 22 })}>N°</th>
              <th style={thDark({ textAlign: "left", paddingLeft: 4, width: 160, fontSize: 9 })}>Nome</th>
              <th style={{ ...CELL, backgroundColor: "#FF0000", color: "#FFFFFF", fontWeight: "700", width: 18 }}>F.J.</th>
              <th style={{ ...CELL, backgroundColor: "#1F3864", color: "#4FC3F7", fontWeight: "700", width: 18 }}>S.A.</th>
              <th style={{ ...CELL, backgroundColor: "#FF7F00", color: "#FFFFFF", fontWeight: "700", width: 18 }}>F.I.</th>
              {days.map(d => {
                const wknd = isWeekend(ano, mesNum, d);
                const dayLabel = `0.${String(d).padStart(2, "0")}`;
                return (
                  <th key={d} style={{
                    ...CELL,
                    backgroundColor: wknd ? "#C5D0DF" : "#2E74B5",
                    color: wknd ? "#555" : "#4FC3F7",
                    fontWeight: "700",
                    fontSize: 7,
                  }}>
                    {dayLabel}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const regCol = registosMap[col.id] || {};

              // Contagens para F.J., S.A., F.I.
              let countFJ = 0, countSA = 0, countFI = 0;
              days.forEach(d => {
                const c = (regCol[d] || "").toUpperCase();
                if (c === "FJ") countFJ++;
                if (c === "F" || c === "FI") countFI++;
              });

              const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F5F7FA";

              return (
                <tr key={col.id}>
                  {/* Nº */}
                  <td style={{
                    ...CELL,
                    backgroundColor: rowBg,
                    color: "#1F3864",
                    fontWeight: "700",
                    fontSize: 8,
                  }}>
                    {col.numero}
                  </td>

                  {/* Nome */}
                  <td style={{
                    ...CELL,
                    backgroundColor: rowBg,
                    textAlign: "right",
                    paddingRight: 5,
                    fontSize: 8,
                    fontWeight: "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {col.nome}
                  </td>

                  {/* F.J. */}
                  <td style={{ ...CELL, backgroundColor: countFJ > 0 ? "#FFCCCC" : rowBg, color: "#CC0000", fontWeight: "700" }}>
                    {countFJ > 0 ? countFJ : ""}
                  </td>

                  {/* S.A. */}
                  <td style={{ ...CELL, backgroundColor: rowBg }}>
                    {""}
                  </td>

                  {/* F.I. */}
                  <td style={{ ...CELL, backgroundColor: countFI > 0 ? "#FFE0B2" : rowBg, color: "#E65100", fontWeight: "700" }}>
                    {countFI > 0 ? countFI : ""}
                  </td>

                  {/* Dias */}
                  {days.map(d => {
                    const wknd = isWeekend(ano, mesNum, d);
                    const code = regCol[d] || "";
                    const cellStyle = getCellStyle(code);

                    if (!code) {
                      return (
                        <td key={d} style={wknd ? tdWeekend() : tdBase({ backgroundColor: rowBg })}></td>
                      );
                    }

                    return (
                      <td key={d} style={{
                        ...CELL,
                        ...cellStyle,
                        fontWeight: "700",
                        fontSize: 7,
                      }}>
                        {code}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>



      <style>{`
        @media print {
          .folha-ponto-wrapper { background: white !important; }
        }
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>
    </div>
  );
}