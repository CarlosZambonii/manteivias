const JUSTIFICACOES = [
  { code: "FE", bg: "#70AD47", color: "#FFFFFF" },
  { code: "BX", bg: "#00B0F0", color: "#FFFFFF" },
  { code: "LP", bg: "#00B050", color: "#FFFFFF" },
  { code: "FI", bg: "#FF7F00", color: "#FFFFFF" },
  { code: "FJ", bg: "#FF0000", color: "#FFFFFF" },
  { code: "AT", bg: "#FF0000", color: "#FFFFFF" },
  { code: "FP", bg: "#7030A0", color: "#FFFFFF" },
  { code: "N",  bg: "#9370DB", color: "#FFFFFF" },
  { code: "S",  bg: "#FF0000", color: "#FFFFFF" },
  { code: "LC", bg: "#FFFF00", color: "#333333" },
  { code: "IP", bg: "#FFC000", color: "#FFFFFF" },
  { code: "F",  bg: "#FF7F00", color: "#FFFFFF" },
  { code: "FM", bg: "#1F3864", color: "#FFFFFF" },
  { code: "EE", bg: "#2E74B5", color: "#FFFFFF" },
];

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
function thJust(bg, color, extra = {}) {
  return { ...CELL, backgroundColor: bg, color: color, fontWeight: "700", ...extra };
}
function tdBase(rowBg, extra = {}) {
  return { ...CELL, backgroundColor: rowBg, color: "#1a1a1a", ...extra };
}

export default function ResumoPessoalJustificacoesTemplate({ data }) {
  const { mes, ano, periodoLabel, colaboradores } = data;
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
            RESUMO MENSAL PESSOAL — JUSTIFICAÇÕES
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
            <col style={{ width: 45 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 35 }} />
            <col style={{ width: 40 }} />
            {JUSTIFICACOES.map(j => <col key={j.code} style={{ width: 28 }} />)}
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
                <th key={j.code} style={thJust(j.bg, j.color)}>{j.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(colaboradores || []).map((col, idx) => {
              const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#EBF3FB";
              return (
                <tr key={idx}>
                  <td style={{ ...CELL, backgroundColor: rowBg, color: "#1a1a1a", textAlign: "left", paddingLeft: 6, fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {col.nome}
                  </td>
                  <td style={tdBase(rowBg)}>{col.empresa || ""}</td>
                  <td style={tdBase(rowBg, { fontWeight: col.diasTrab ? "600" : "400" })}>{col.diasTrab || ""}</td>
                  <td style={tdBase(rowBg, { fontWeight: col.hrObra ? "600" : "400" })}>{col.hrObra || ""}</td>
                  <td style={tdBase(rowBg, {
                    color: col.hrExtra ? "#C65000" : "#1a1a1a",
                    fontWeight: col.hrExtra ? "700" : "400",
                    backgroundColor: col.hrExtra ? "#FFF3E0" : rowBg,
                  })}>
                    {col.hrExtra || ""}
                  </td>
                  <td style={tdBase(rowBg, { fontWeight: col.sabados ? "600" : "400" })}>{col.sabados || ""}</td>
                  <td style={tdBase(rowBg, { fontWeight: col.hrTotais ? "600" : "400" })}>{col.hrTotais || ""}</td>
                  {JUSTIFICACOES.map(j => {
                    const val = col.justificacoes?.[j.code];
                    return (
                      <td key={j.code} style={{
                        ...CELL,
                        backgroundColor: val ? j.bg : rowBg,
                        color: val ? j.color : "#1a1a1a",
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
      <style>{`@page { size: A4 landscape; margin: 8mm; }`}</style>
    </div>
  );
}
