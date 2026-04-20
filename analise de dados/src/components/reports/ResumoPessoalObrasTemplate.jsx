// ResumoPessoalObrasTemplate

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
function thObra(extra = {}) {
  return { ...CELL, backgroundColor: "#2E74B5", color: "#FFFFFF", fontWeight: "700", ...extra };
}
function tdBase(rowBg, extra = {}) {
  return { ...CELL, backgroundColor: rowBg, color: "#1a1a1a", ...extra };
}

// ─── Componente principal ─────────────────────────────────────────────────────
// data = {
//   mes: "Agosto",
//   ano: 2025,
//   colaboradores: [
//     {
//       nome: "José Monteiro de Carvalho",
//       empresa: "Manteivias",
//       totalNormais: "184:00",
//       totalExtra: "23:00",
//       totalHoras: "207:00",
//       obras: { "146": "144:00", "156": "40:00" },
//       cor: null,
//     }, ...
//   ],
//   obraIds: ["146", "600", "900", "10", ...],   // colunas dinâmicas
// }
export default function ResumoPessoalObrasTemplate({ data }) {
  const { mes, ano, colaboradores, obraIds } = data;

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
            RESUMO MENSAL PESSOAL — OBRAS
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
            <col style={{ width: 52 }} />  {/* Total Horas Normais */}
            <col style={{ width: 40 }} />  {/* Total Extra */}
            <col style={{ width: 40 }} />  {/* Total Horas */}
            {(obraIds || []).map(id => (
              <col key={id} style={{ width: 38 }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th style={thHeader({ textAlign: "left", paddingLeft: 6 })}>Resumo Mensal</th>
              <th style={thHeader()}>Empresa</th>
              <th style={thHeader()}>dias trab.</th>
              <th style={thHeader()}>total horas normais</th>
              <th style={thHeader()}>total extra</th>
              <th style={thHeader()}>total horas</th>
              {(obraIds || []).map(id => (
                <th key={id} style={thObra()}>{id}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const rowBg = col.cor || (idx % 2 === 0 ? "#FFFFFF" : "#EBF3FB");
              const textColor = col.cor ? "#FFFFFF" : "#1a1a1a";

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
                  <td style={tdBase(rowBg, { color: textColor })}>{col.empresa || ""}</td>

                  {/* Dias Trabalhados */}
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.diasTrab ? "600" : "400" })}>
                    {col.diasTrab || ""}
                  </td>

                  {/* Total Horas Normais */}
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.totalNormais ? "600" : "400" })}>
                    {col.totalNormais || ""}
                  </td>

                  {/* Total Extra */}
                  <td style={tdBase(rowBg, {
                    color: col.totalExtra ? "#C65000" : textColor,
                    fontWeight: col.totalExtra ? "700" : "400",
                    backgroundColor: col.totalExtra ? (col.cor ? rowBg : "#FFF3E0") : rowBg,
                  })}>
                    {col.totalExtra || ""}
                  </td>

                  {/* Total Horas */}
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.totalHoras ? "600" : "400" })}>
                    {col.totalHoras || ""}
                  </td>

                  {/* Colunas por Obra */}
                  {(obraIds || []).map(id => {
                    const val = col.obras?.[id] || "";
                    return (
                      <td key={id} style={tdBase(rowBg, {
                        color: val ? "#1F3864" : textColor,
                        fontWeight: val ? "600" : "400",
                        backgroundColor: val ? (col.cor ? rowBg : "#EBF3FB") : rowBg,
                      })}>
                        {val}
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