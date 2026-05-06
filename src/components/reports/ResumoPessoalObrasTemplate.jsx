const CELL = {
  borderRight: "1px solid #9FA8B4",
  borderBottom: "1px solid #9FA8B4",
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

export default function ResumoPessoalObrasTemplate({ data }) {
  const { mes, ano, periodoLabel, colaboradores, obraIds } = data;
  const mesLabel = (mes || "").toUpperCase();

  return (
    <div style={{ fontFamily: "Calibri, Arial, sans-serif", background: "#fff", color: "#1a1a1a", fontSize: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, gap: 16, borderBottom: "2px solid #1F3864", paddingBottom: 8 }}>
        <img
          src="/logo.png"
          alt="Manteivias"
          style={{ height: 44, objectFit: "contain" }}
          onError={e => { e.target.src = "https://storage.googleapis.com/hostinger-horizons-assets-prod/d062604b-d8fe-416f-a25d-71de29bc3dc0/a445b8a745a1d79fa57a195f52fac4b4.png"; e.target.onerror = null; }}
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "700", fontSize: 13, color: "#1F3864", letterSpacing: 1 }}>
            RESUMO MENSAL PESSOAL — OBRAS
          </div>
          <div style={{ fontWeight: "500", fontSize: 10, color: "#2E74B5", marginTop: 2 }}>
            {periodoLabel || `${mesLabel} ${ano}`} · Todos os Colaboradores
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderTop: "1px solid #9FA8B4", borderLeft: "1px solid #9FA8B4" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: 160 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 35 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 40 }} />
            {(obraIds || []).map(id => <col key={id} style={{ width: 38 }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={thHeader({ textAlign: "left", paddingLeft: 6 })}>Resumo Mensal</th>
              <th style={thHeader()}>Empresa</th>
              <th style={thHeader()}>dias trab.</th>
              <th style={thHeader()}>total horas normais</th>
              <th style={thHeader()}>total extra</th>
              <th style={thHeader()}>total horas</th>
              {(obraIds || []).map(id => <th key={id} style={thObra()}>{id}</th>)}
            </tr>
          </thead>
          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const rowBg = col.cor || (idx % 2 === 0 ? "#FFFFFF" : "#EBF3FB");
              const textColor = col.cor ? "#FFFFFF" : "#1a1a1a";
              return (
                <tr key={idx}>
                  <td style={{ ...CELL, backgroundColor: rowBg, color: textColor, textAlign: "left", paddingLeft: 6, fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {col.nome}
                  </td>
                  <td style={tdBase(rowBg, { color: textColor })}>{col.empresa || ""}</td>
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.diasTrab ? "600" : "400" })}>
                    {col.diasTrab || ""}
                  </td>
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.totalNormais ? "600" : "400" })}>
                    {col.totalNormais || ""}
                  </td>
                  <td style={tdBase(rowBg, {
                    color: col.totalExtra ? "#C65000" : textColor,
                    fontWeight: col.totalExtra ? "700" : "400",
                    backgroundColor: col.totalExtra ? (col.cor ? rowBg : "#FFF3E0") : rowBg,
                  })}>
                    {col.totalExtra || ""}
                  </td>
                  <td style={tdBase(rowBg, { color: textColor, fontWeight: col.totalHoras ? "600" : "400" })}>
                    {col.totalHoras || ""}
                  </td>
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
      <style>{`@page { size: A4 landscape; margin: 8mm; }`}</style>
    </div>
  );
}
