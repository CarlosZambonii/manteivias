// ResumoPessoalJustificacoesTemplate
// Colunas de justificações (fiel ao Excel)

const JUSTIFICACOES = [
  { code: "FE",  label: "FE",  bg: "#70AD47", color: "#FFFFFF" },
  { code: "BX",  label: "BX",  bg: "#00B0F0", color: "#FFFFFF" },
  { code: "LP",  label: "LP",  bg: "#00B050", color: "#FFFFFF" },
  { code: "FI",  label: "FI",  bg: "#FF7F00", color: "#FFFFFF" },
  { code: "FJ",  label: "FJ",  bg: "#FF0000", color: "#FFFFFF" },
  { code: "AT",  label: "AT",  bg: "#FF0000", color: "#FFFFFF" },
  { code: "FP",  label: "FP",  bg: "#7030A0", color: "#FFFFFF" },
  { code: "N",   label: "N",   bg: "#9370DB", color: "#FFFFFF" },
  { code: "S",   label: "S",   bg: "#FF0000", color: "#FFFFFF" },
  { code: "LC",  label: "LC",  bg: "#FFFF00", color: "#333333" },
  { code: "IP",  label: "IP",  bg: "#FFC000", color: "#FFFFFF" },
  { code: "F",   label: "F",   bg: "#FF7F00", color: "#FFFFFF" },
  { code: "FM",  label: "FM",  bg: "#1F3864", color: "#FFFFFF" },
  { code: "EE",  label: "EE",  bg: "#2E74B5", color: "#FFFFFF" },
];

// ─── Estilos base ─────────────────────────────────────────────────────────────
const CELL = {
  border: "1px solid #9FA8B4",
  padding: "2px 4px",
  fontSize: 8,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  textAlign: "center",
  lineHeight: "14px",
};

function thHeader(extra = {}) {
  return { ...CELL, backgroundColor: "#1F3864", color: "#4FC3F7", fontWeight: "700", ...extra };
}
function thJust(bg, color, extra = {}) {
  return { ...CELL, backgroundColor: bg, color: color, fontWeight: "700", ...extra };
}
function tdBase(rowBg, extra = {}) {
  return { ...CELL, backgroundColor: rowBg, color: "#1a1a1a", ...extra };
}

export default function ResumoPessoalJustificacoesTemplate({ data }) {
  const { mes, ano, colaboradores } = data;
  const mesLabel = (mes || "").toUpperCase();

  return (
    <div style={{ fontFamily: "Calibri, Arial, sans-serif", background: "#fff", color: "#1a1a1a", fontSize: 8 }}>

      {/* ── Logo + Título ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, gap: 16, borderBottom: "2px solid #1F3864", paddingBottom: 8 }}>
        <img
          src="https://media.base44.com/images/public/69c6b5e5129ab060bc75b134/531c44530_image.png"
          alt="Manteivias"
          style={{ height: 44, objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "700", fontSize: 13, color: "#1F3864", letterSpacing: 1 }}>
            RESUMO MENSAL PESSOAL — JUSTIFICAÇÕES
          </div>
          <div style={{ fontWeight: "500", fontSize: 10, color: "#2E74B5", marginTop: 2 }}>
            {mesLabel} {ano} · Todos os Colaboradores
          </div>
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: 160 }} /> {/* Nome */}
            <col style={{ width: 70 }} />  {/* Empresa */}
            <col style={{ width: 35 }} />  {/* Dias Trab */}
            <col style={{ width: 45 }} />  {/* Hr em obra */}
            <col style={{ width: 40 }} />  {/* H. extra */}
            <col style={{ width: 35 }} />  {/* Sábados */}
            <col style={{ width: 40 }} />  {/* Hr totais */}
            {JUSTIFICACOES.map(j => (
              <col key={j.code} style={{ width: 28 }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th style={thHeader({ textAlign: "left", paddingLeft: 6 })}>Resumo Mensal</th>
              <th style={thHeader()}>Empresa</th>
              <th style={thHeader()}>Dias Trab.</th>
              <th style={thHeader()}>Hr em obra</th>
              <th style={thHeader()}>H. extra</th>
              <th style={thHeader()}>Sábados</th>
              <th style={thHeader()}>Hr totais</th>
              {JUSTIFICACOES.map(j => (
                <th key={j.code} style={thJust(j.bg, j.color)}>{j.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#EBF3FB";
              const textColor = "#1a1a1a";

              return (
                <tr key={idx}>
                  {/* Nome */}
                  <td style={{
                    ...CELL,
                    backgroundColor: rowBg,
                    color: textColor,
                    textAlign: "left",
                    paddingLeft: 6,
                    fontWeight: "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {col.nome}
                  </td>

                  {/* Empresa */}
                  <td style={tdBase(rowBg)}>{col.empresa || ""}</td>

                  {/* Dias Trabalhados */}
                  <td style={tdBase(rowBg, { fontWeight: col.diasTrab ? "600" : "400" })}>
                    {col.diasTrab || ""}
                  </td>

                  {/* Hr em obra */}
                  <td style={tdBase(rowBg, { fontWeight: col.hrObra ? "600" : "400" })}>
                    {col.hrObra || ""}
                  </td>

                  {/* H. extra */}
                  <td style={tdBase(rowBg, {
                    color: col.hrExtra ? "#C65000" : textColor,
                    fontWeight: col.hrExtra ? "700" : "400",
                    backgroundColor: col.hrExtra ? "#FFF3E0" : rowBg,
                  })}>
                    {col.hrExtra || ""}
                  </td>

                  {/* Sábados */}
                  <td style={tdBase(rowBg, { fontWeight: col.sabados ? "600" : "400" })}>
                    {col.sabados || ""}
                  </td>

                  {/* Hr totais */}
                  <td style={tdBase(rowBg, { fontWeight: col.hrTotais ? "600" : "400" })}>
                    {col.hrTotais || ""}
                  </td>

                  {/* Colunas de Justificações */}
                  {JUSTIFICACOES.map(j => {
                    const val = col.justificacoes?.[j.code];
                    return (
                      <td key={j.code} style={{
                        ...CELL,
                        backgroundColor: val ? j.bg : rowBg,
                        color: val ? j.color : textColor,
                        fontWeight: val ? "700" : "400",
                      }}>
                        {val || ""}
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
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>
    </div>
  );
}