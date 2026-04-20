import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, FileDown, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import FolhaPontoTemplate from "./FolhaPontoTemplate";
import { generatePDF } from "./printUtils";

export default function FolhaPontoPreview({ data, showAv, onClose }) {
  const [zoom, setZoom] = useState(0.9);
  const [generating, setGenerating] = useState(false);
  const contentRef = useRef(null);

  const handlePDF = async () => {
    if (!contentRef.current || generating) return;
    setGenerating(true);
    try {
      await generatePDF(contentRef.current, `Folha_Ponto_${data.mes}_${data.ano}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex flex-col" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Preview — Folha de Ponto</span>
          <span className="text-xs text-gray-400 ml-2">{data.mes} {data.ano}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1.5 rounded hover:bg-gray-700 text-gray-300">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 rounded hover:bg-gray-700 text-gray-300">
            <ZoomIn className="w-4 h-4" />
          </button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 ml-2" onClick={handlePDF} disabled={generating}>
            <FileDown className="w-4 h-4 mr-1.5" />
            {generating ? "A gerar…" : "Descarregar PDF"}
          </Button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: `${100 / zoom}%`, transition: "transform 0.15s ease" }}>
          <div ref={contentRef} className="bg-white shadow-2xl" style={{ margin: "0 auto", padding: "16px 14px", maxWidth: 1050 }}>
            <FolhaPontoTemplate data={data} showAv={showAv} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
