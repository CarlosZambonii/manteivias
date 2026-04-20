import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResumoPessoalObrasTemplate from "./ResumoPessoalObrasTemplate";

export default function ResumoPessoalObrasPreview({ data, onClose }) {
  const [zoom, setZoom] = useState(0.85);

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex flex-col print:bg-white print:relative print:inset-auto" style={{ zIndex: 9999 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Preview — Resumo Mensal Pessoal Obras</span>
          <span className="text-xs text-gray-400 ml-2">
            {data.mes} {data.ano}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-300"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-300"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-gray-700 ml-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir / PDF
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-300 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de scroll */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4 print:p-0 print:overflow-visible print:bg-white">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            width: `${100 / zoom}%`,
            transition: "transform 0.15s ease",
          }}
          className="print:transform-none print:w-full"
        >
          <div
            className="bg-white shadow-2xl print:shadow-none"
            style={{ margin: "0 auto", padding: "16px 14px", maxWidth: 1100 }}
          >
            <ResumoPessoalObrasTemplate data={data} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}