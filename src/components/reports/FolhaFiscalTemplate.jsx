import { useMemo } from "react";

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
  return new Date(year, month - 1, day).getDay();
}

const WEEKDAY_LABELS = {
  1: "Segunda Feira",
  2: "Terça Feira",
  3: "Quarta Feira",
  4: "Quinta Feira",
  5: "Sexta Feira",
};

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

export default function FolhaFiscalTemplate({ data, showAv = false }) {
  const { mes, ano, obra, empresa = "Manteivias", colaboradores, registos } = data;

  const mesNum    = useMemo(() => mesNumero(mes), [mes]);
  const daysCount = useMemo(() => getDaysInMonth(ano, mesNum), [ano, mesNum]);

  const registosMap = useMemo(() => {
    const map = {};
    (registos || []).forEach(({ colaborador_id, dia, manha, tarde, av }) => {
      if (!map[colaborador_id]) map[colaborador_id] = {};
      map[colaborador_id][dia] = { manha: manha || "", tarde: tarde || "", av: av || "" };
    });
    return map;
  }, [registos]);

  const firstDay = `01/${String(mesNum).padStart(2, "0")}/${ano}`;
  const lastDay  = `${String(daysCount).padStart(2, "0")}/${String(mesNum).padStart(2, "0")}/${ano}`;
  const periodo  = `${firstDay} - ${lastDay}`;

  const weekdayOrder = showAv ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
  const colsPerWeekday = showAv ? 3 : 2;

  return (
    <div style={{ fontFamily: "Calibri, Arial, sans-serif", background: "#fff", color: "#1a1a1a", fontSize: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, borderBottom: "2px solid #1F3864", paddingBottom: 6 }}>
        <img
          src="/logo.png"
          alt="Manteivias"
          style={{ height: 44, objectFit: "contain" }}
          onError={e => { e.target.src = "https://storage.googleapis.com/hostinger-horizons-assets-prod/d062604b-d8fe-416f-a25d-71de29bc3dc0/a445b8a745a1d79fa57a195f52fac4b4.png"; e.target.onerror = null; }}
        />
        <div style={{ fontWeight: "700", fontSize: 13, color: "#1F3864" }}>FOLHA FISCAL</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "700", fontSize: 11, color: "#1F3864" }}>{obra}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 6, backgroundColor: "#D9D9D9", padding: "3px 8px" }}>
        <div style={{ fontWeight: "600", fontSize: 9, color: "#1F3864" }}>{periodo}</div>
      </div>

      <div style={{ marginBottom: 4, fontWeight: "700", fontSize: 10, color: "#1F3864", textAlign: "center" }}>
        FOLHA FISCAL — {showAv ? "COM AV" : "SEM AV"}
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "auto", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...TH_DARK, width: 130, textAlign: "left", paddingLeft: 4 }} rowSpan={2}>Nome</th>
              <th style={{ ...TH_DARK, width: 70 }} rowSpan={2}>Empresa</th>
              {weekdayOrder.map(dow => {
                if (dow === 6) return <th key={dow} style={TH_SAB} colSpan={1}>Sáb</th>;
                if (dow === 0) return <th key={dow} style={TH_SAB} colSpan={1}>Dom</th>;
                return <th key={dow} style={TH_WEEK} colSpan={colsPerWeekday}>{WEEKDAY_LABELS[dow]}</th>;
              })}
            </tr>
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
                  <td style={{ ...CELL, backgroundColor: rowBg, textAlign: "left", paddingLeft: 4, fontWeight: "500" }}>{col.nome}</td>
                  <td style={{ ...CELL, backgroundColor: rowBg }}>{col.empresa || empresa}</td>
                  {weekdayOrder.map(dow => {
                    if (dow === 6 || dow === 0) {
                      if (!showAv) return null;
                      const dayEntry = Object.entries(regCol).find(([d]) => getDayOfWeek(ano, mesNum, parseInt(d)) === dow);
                      const av = dayEntry ? dayEntry[1].av : "";
                      return <td key={dow} style={{ ...CELL, backgroundColor: "#FCE4D6" }}>{av}</td>;
                    }
                    const dayEntries = Object.entries(regCol).filter(([d]) => getDayOfWeek(ano, mesNum, parseInt(d)) === dow);
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
      <style>{`@page { size: A4 landscape; margin: 8mm; }`}</style>
    </div>
  );
}
