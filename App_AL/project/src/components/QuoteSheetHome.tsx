import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useRef,
  useEffect,
} from "react";
import {
  ArrowLeft,
  X,
  Eye,
  Download,
  Share2,
  Trash2,
  Edit3,
} from "lucide-react";
import html2canvas from "html2canvas";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import jsPDF from "jspdf";
import "./QuoteSheetHome.css";
// NOTA: Se elimina la importación del plugin Gallery que no funciona en Android
// import { Gallery } from "../plugins/gallery";

interface QuoteSheetHomeProps {
  onBack: () => void;
  onOpenSavedSheets?: () => void;
  onEditFixedData?: () => void;
  onNewQuoteSheet?: () => void;
}

interface FixedDataFormState {
  companyName: string;
  locality: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  phone: string;
  logoPreview?: string | null;
  sheetColor?: string;
}

interface QuoteFormState {
  date: string;
  client: string;
  pieces: string[];
  total: string;
}

interface SavedQuote {
  id: number;
  date: string;
  client: string;
  pieces: string[];
  total: string;
}

const PIECES_PER_PAGE = 20;

const LS_FIXED_DATA_KEY = "alcalc_quote_fixedData_v1";
const LS_SAVED_QUOTES_KEY = "alcalc_quote_savedQuotes_v1";

interface SheetColorOption {
  id: string;
  label: string;
  hex: string;
  file: string;
}

const SHEET_COLORS: SheetColorOption[] = [
  {
    id: "azulPredeterminado",
    label: "Azul predeterminado",
    hex: "#043c84",
    file: "azul-predeterminado- 043c84 .png",
  },
  {
    id: "negro",
    label: "Negro",
    hex: "#000000",
    file: "negro-000000.png",
  },
  {
    id: "rojo",
    label: "Rojo",
    hex: "#ff0000",
    file: "rojo-ff0000.png",
  },
  {
    id: "turquesa",
    label: "Turquesa",
    hex: "#04b4ac",
    file: "turquesa- 04b4ac.png",
  },
  {
    id: "verde",
    label: "Verde",
    hex: "#008000",
    file: "verde-008000.png",
  },
  {
    id: "gris",
    label: "Gris",
    hex: "#808080",
    file: "gris-808080.png",
  },
  {
    id: "azulCielo",
    label: "Azul cielo",
    hex: "#34bcec",
    file: "Azul-cielo-34bcec.png",
  },
];

const QuoteSheetHome: React.FC<QuoteSheetHomeProps> = ({
  onBack,
  onOpenSavedSheets,
  onEditFixedData,
  onNewQuoteSheet,
}) => {
  const [showFixedDataModal, setShowFixedDataModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [fixedData, setFixedData] = useState<FixedDataFormState>({
    companyName: "",
    locality: "",
    postalCode: "",
    street: "",
    streetNumber: "",
    phone: "",
    logoPreview: null,
    sheetColor: "azulPredeterminado",
  });
  const [quoteData, setQuoteData] = useState<QuoteFormState>({
    date: "",
    client: "",
    pieces: [""],
    total: "",
  });
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<SavedQuote | null>(null);
  const [quoteForExport, setQuoteForExport] = useState<SavedQuote | null>(null);
  const [exportAction, setExportAction] = useState<
    "download" | "share" | null
  >(null);
  const [exportMode, setExportMode] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);

  const resetQuoteForm = () => {
    setQuoteData({
      date: "",
      client: "",
      pieces: [""],
      total: "",
    });
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setEditingQuoteId(null);
    resetQuoteForm();
  };

  // ─────────────────────────────────────────────
  // PERSISTENCIA LOCAL
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawFixed = localStorage.getItem(LS_FIXED_DATA_KEY);
      if (rawFixed) {
        const parsed = JSON.parse(rawFixed) as Partial<FixedDataFormState>;
        setFixedData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error("[Hoja] Error al leer datos fijos de localStorage:", err);
    }

    try {
      const rawQuotes = localStorage.getItem(LS_SAVED_QUOTES_KEY);
      if (rawQuotes) {
        const parsed = JSON.parse(rawQuotes) as SavedQuote[];
        setSavedQuotes(parsed);
      }
    } catch (err) {
      console.error(
        "[Hoja] Error al leer cotizaciones de localStorage:",
        err
      );
    }

    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(LS_FIXED_DATA_KEY, JSON.stringify(fixedData));
    } catch (err) {
      console.error("[Hoja] Error al guardar datos fijos en localStorage:", err);
    }
  }, [fixedData, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(LS_SAVED_QUOTES_KEY, JSON.stringify(savedQuotes));
    } catch (err) {
      console.error(
        "[Hoja] Error al guardar cotizaciones en localStorage:",
        err
      );
    }
  }, [savedQuotes, storageLoaded]);

  // ─────────────────────────────────────────────
  // Topbar
  // ─────────────────────────────────────────────

  const handleFixedDataClick = () => {
    setShowFixedDataModal(true);
    if (onEditFixedData) onEditFixedData();
  };

  const handleNewQuoteClick = () => {
    setEditingQuoteId(null);
    resetQuoteForm();
    setShowQuoteModal(true);
    if (onNewQuoteSheet) onNewQuoteSheet();
  };

  const isFixedDataComplete = Boolean(
    fixedData.companyName.trim() &&
      fixedData.locality.trim() &&
      fixedData.postalCode.trim() &&
      fixedData.street.trim() &&
      fixedData.streetNumber.trim() &&
      fixedData.phone.trim()
  );

  const fixedDataButtonLabel = isFixedDataComplete
    ? "✓ Tus datos"
    : "+ Tus datos";

  // ─────────────────────────────────────────────
  // Datos fijos
  // ─────────────────────────────────────────────

  const handleFixedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFixedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFixedData((prev) => ({
        ...prev,
        logoPreview:
          typeof reader.result === "string" ? reader.result : null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFixedDataSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("[Hoja] Datos fijos guardados:", fixedData);
    setShowFixedDataModal(false);
  };

  // ─────────────────────────────────────────────
  // Nueva hoja de cotización / edición
  // ─────────────────────────────────────────────

  const handleQuoteInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuoteData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePieceChange = (index: number, value: string) => {
    setQuoteData((prev) => {
      const nextPieces = [...prev.pieces];
      nextPieces[index] = value;
      return { ...prev, pieces: nextPieces };
    });
  };

  const handleAddPiece = () => {
    setQuoteData((prev) => ({
      ...prev,
      pieces: [...prev.pieces, ""],
    }));
  };

  const handleRemovePiece = (index: number) => {
    setQuoteData((prev) => {
      const nextPieces = prev.pieces.filter((_, i) => i !== index);
      if (nextPieces.length === 0) {
        nextPieces.push("");
      }
      return { ...prev, pieces: nextPieces };
    });
  };

  const handleQuoteSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (editingQuoteId !== null) {
      const updated: SavedQuote = {
        id: editingQuoteId,
        date: quoteData.date,
        client: quoteData.client,
        pieces: [...quoteData.pieces],
        total: quoteData.total,
      };

      setSavedQuotes((prev) =>
        prev.map((item) => (item.id === editingQuoteId ? updated : item))
      );

      if (previewQuote && previewQuote.id === editingQuoteId) {
        setPreviewQuote(updated);
      }

      console.log("[Hoja] Cotización actualizada:", updated);
    } else {
      const newQuote: SavedQuote = {
        id: Date.now(),
        date: quoteData.date,
        client: quoteData.client,
        pieces: [...quoteData.pieces],
        total: quoteData.total,
      };

      setSavedQuotes((prev) => [newQuote, ...prev]);
      console.log("[Hoja] Cotización guardada:", newQuote);
    }

    closeQuoteModal();
  };

  const handleEditQuote = (q: SavedQuote) => {
    setEditingQuoteId(q.id);
    setQuoteData({
      date: q.date,
      client: q.client,
      pieces: q.pieces && q.pieces.length > 0 ? [...q.pieces] : [""],
      total: q.total,
    });
    setShowQuoteModal(true);
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const getSheetBackgroundUrl = () => {
    const selectedId = fixedData.sheetColor || "azulPredeterminado";
    const option =
      SHEET_COLORS.find((c) => c.id === selectedId) || SHEET_COLORS[0];
    const safeFile = encodeURI(option.file);
    return `/assets/${safeFile}`;
  };

  const formatDate = (value: string) => {
    if (!value) return "";

    if (value.includes("T")) {
      const iso = value.split("T")[0];
      const partsIso = iso.split("-");
      if (partsIso.length === 3) {
        const [y, m, d] = partsIso;
        const dd = d.padStart(2, "0");
        const mm = m.padStart(2, "0");
        return `${dd}/${mm}/${y}`;
      }
    }

    if (value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        const dd = p1.padStart(2, "0");
        const mm = p2.padStart(2, "0");
        const yyyy = p3.length === 2 ? `20${p3}` : p3;
        return `${dd}/${mm}/${yyyy}`;
      }
      return value;
    }

    if (value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const [y, m, d] = parts;
          const dd = d.padStart(2, "0");
          const mm = m.padStart(2, "0");
          return `${dd}/${mm}/${y}`;
        } else {
          const [d, m, y] = parts;
          const dd = d.padStart(2, "0");
          const mm = m.padStart(2, "0");
          return `${dd}/${mm}/${y}`;
        }
      }
    }

    return value;
  };

  const formatTotal = (value: string) => {
    if (!value) return "0";
    const num = Number(value);
    if (!Number.isFinite(num)) return value;
    return num.toLocaleString("es-MX", { minimumFractionDigits: 0 });
  };

  // ─────────────────────────────────────────────
  // Acciones tarjeta
  // ─────────────────────────────────────────────

  const handleViewQuote = (q: SavedQuote) => {
    setPreviewQuote(q);
  };

  const handleDownloadQuote = (q: SavedQuote) => {
    const ok = window.confirm(
      "¿Estás seguro que quieres guardar en la galería esta cotización?"
    );
    if (!ok) return;
    setQuoteForExport(q);
    setExportAction("download");
    setExportMode(true);
  };

  const handleShareQuote = (q: SavedQuote) => {
    // Calcular cuántas páginas tendría esta cotización
    const pieces = q.pieces
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const totalPages = Math.max(1, Math.ceil(pieces.length / PIECES_PER_PAGE));
    
    let message = "";
    if (totalPages === 1) {
      message = "¿Quieres compartir esta cotización como imagen JPG?";
    } else {
      message = `Esta cotización tiene ${totalPages} páginas. ¿Quieres compartirla como un solo archivo PDF?`;
    }
    
    const ok = window.confirm(message);
    if (!ok) return;
    
    setQuoteForExport(q);
    setExportAction("share");
    setExportMode(true);
  };

  const handleDeleteQuote = (q: SavedQuote) => {
    const ok = window.confirm(
      "¿Estás seguro de eliminar esta cotización?"
    );
    if (!ok) return;
    setSavedQuotes((prev) => prev.filter((item) => item.id !== q.id));
  };

  // ─────────────────────────────────────────────
  // Renderizar páginas
  // ─────────────────────────────────────────────

  const renderQuotePages = (quote: SavedQuote) => {
    const pieces = quote.pieces
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const totalPages = Math.max(
      1,
      Math.ceil(pieces.length / PIECES_PER_PAGE)
    );

    return Array.from({ length: totalPages }).map((_, pageIndex) => {
      const start = pageIndex * PIECES_PER_PAGE;
      const end = start + PIECES_PER_PAGE;
      const pagePieces = pieces.slice(start, end);
      const showTotalOnThisPage = pageIndex === 0;

      return (
        <div
          key={pageIndex}
          className="qsh-preview-page"
          style={{ backgroundImage: `url("${getSheetBackgroundUrl()}")` }}
        >
          <div className="qsh-sheet-header">
            <div className="qsh-sheet-logo">
              {fixedData.logoPreview ? (
                <img
                  src={fixedData.logoPreview}
                  alt="Logo"
                  className="qsh-sheet-logo-img"
                />
              ) : (
                <div className="qsh-sheet-logo-placeholder">
                  LOGO
                </div>
              )}
            </div>

            <div className="qsh-sheet-header-main">
              <div className="qsh-sheet-company">
                {fixedData.companyName || "Nombre de tu empresa"}
              </div>
              <div className="qsh-sheet-subtitle">Hoja de cotización</div>

              <div className="qsh-sheet-header-bottom">
                <div className="qsh-sheet-header-left">
                  <div>{fixedData.locality || "Tu localidad..."}</div>
                  <div>
                    {fixedData.postalCode
                      ? `CP: ${fixedData.postalCode}`
                      : ""}
                  </div>
                  <div>
                    {(fixedData.street || "Tu calle") +
                      (fixedData.streetNumber
                        ? ` , ${fixedData.streetNumber}`
                        : "")}
                  </div>
                  <div>
                    Teléfono: {fixedData.phone || "Tu teléfono"}
                  </div>
                </div>

                <div className="qsh-sheet-header-right">
                  <div className="qsh-sheet-header-right-row">
                    Fecha: {formatDate(quote.date)}
                  </div>
                  <div className="qsh-sheet-header-right-row">
                    Cliente: {quote.client || "Nombre del cliente"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="qsh-sheet-body">
            <div className="qsh-sheet-details-title">
              Detalles de cotización:
            </div>

            <div className="qsh-sheet-table">
              <div className="qsh-sheet-table-header">
                <div className="qsh-sheet-table-col piezas">Piezas</div>
                <div className="qsh-sheet-table-col total">Total</div>
              </div>

              <div className="qsh-sheet-table-body">
                <div className="qsh-sheet-pieces-list">
                  {pagePieces.map((p, idx) => (
                    <div key={idx}>
                      <span className="qsh-piece-bullet">* </span>
                      {p}
                    </div>
                  ))}
                </div>

                <div className="qsh-sheet-total-value">
                  {showTotalOnThisPage ? formatTotal(quote.total) : ""}
                </div>
              </div>
            </div>

            <div className="qsh-sheet-footer">
              <span>Cotizado desde AL Calculadora</span>
              <span>
                Pág. {pageIndex + 1} de {totalPages}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  // ─────────────────────────────────────────────
  // Función auxiliar para convertir blob a base64
  // ─────────────────────────────────────────────

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ─────────────────────────────────────────────
  // Exportar a JPG / PDF / compartir - VERSIÓN CORREGIDA
  // ─────────────────────────────────────────────

  useEffect(() => {
    const runExport = async () => {
      if (!quoteForExport || !exportAction || !exportMode) return;
      const container = exportContainerRef.current;
      if (!container) return;

      const pageElements = Array.from(
        container.querySelectorAll<HTMLElement>(".qsh-preview-page")
      );
      if (pageElements.length === 0) return;

      try {
        const images: string[] = [];

        // 🔧 OPCIÓN 3: Capturar con mejor calidad y dimensiones específicas
        for (const pageEl of pageElements) {
          // 🔍 Debug: Ver dimensiones reales del elemento
          console.log("Dimensiones del elemento para captura:", {
            width: pageEl.offsetWidth,
            height: pageEl.offsetHeight,
            clientWidth: pageEl.clientWidth,
            clientHeight: pageEl.clientHeight
          });

          const canvas = await html2canvas(pageEl, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: 2.5, // 🔧 OPCIÓN 3: Aumentar escala para mejor calidad
            scrollX: 0,
            scrollY: 0,
            width: pageEl.offsetWidth, // Usar dimensiones reales
            height: pageEl.offsetHeight,
          });

          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          images.push(dataUrl);
          
          console.log("Imagen capturada:", {
            width: canvas.width,
            height: canvas.height,
            dataUrlLength: dataUrl.length
          });
        }

        if (exportAction === "download") {
          // 🔽 DESCARGAR (guardar imágenes JPG en galería)
          const isNative = Capacitor.getPlatform() !== "web";

          if (isNative) {
            // 📱 Dispositivo nativo: guardar imágenes en galería
            try {
              for (let i = 0; i < images.length; i++) {
                const base64Data = images[i].split(",")[1];
                const safeClient = quoteForExport.client?.trim().replace(/\s+/g, "_") || "cotizacion";
                const fileName = `${safeClient}-pag-${i + 1}.jpg`;
                
                // Guardar en la carpeta Pictures para que aparezca en la galería
                await Filesystem.writeFile({
                  path: `Pictures/${fileName}`,
                  data: base64Data,
                  directory: Directory.ExternalStorage,
                  recursive: true
                });
                
                console.log(`[Hoja] Imagen ${i + 1} guardada en Pictures/${fileName}`);
              }
              
              // Mostrar mensaje de éxito
              if (images.length === 1) {
                alert("Imagen guardada en la carpeta de Imágenes del dispositivo.");
              } else {
                alert(`${images.length} imágenes guardadas en la carpeta de Imágenes del dispositivo.`);
              }
            } catch (err) {
              console.error("[Hoja] Error al guardar imágenes:", err);
              alert("Error al guardar las imágenes: " + (err as Error).message);
            }
          } else {
            // 🌐 WEB: descarga normal de imágenes JPG
            images.forEach((dataUrl, index) => {
              const a = document.createElement("a");
              const pageNumber = index + 1;
              const safeClient = quoteForExport.client?.trim().replace(/\s+/g, "_") || "cotizacion";
              a.href = dataUrl;
              a.download = `${safeClient}-pag-${pageNumber}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }
        } else if (exportAction === "share") {
          // 🔄 COMPARTIR (nueva lógica con PDF para múltiples páginas)
          const safeClient = quoteForExport.client?.trim().replace(/\s+/g, "_") || "cotizacion";
          
          if (images.length > 1) {
            // 📄 MÚLTIPLES PÁGINAS: Crear PDF
            console.log(`[Hoja] Creando PDF con ${images.length} páginas`);
            
            // Crear PDF en orientación vertical (portrait), tamaño A4
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 🔧 OPCIÓN 2: Añadir cada imagen escalada correctamente
            for (let i = 0; i < images.length; i++) {
              if (i > 0) {
                pdf.addPage();
              }
              
              const imgProps = pdf.getImageProperties(images[i]);
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              
              console.log(`Imagen ${i+1} propiedades:`, {
                imgWidth: imgProps.width,
                imgHeight: imgProps.height,
                imgAspectRatio: imgProps.width / imgProps.height,
                pdfWidth,
                pdfHeight,
                pdfAspectRatio: pdfWidth / pdfHeight
              });
              
              // Calcular escala para llenar toda la página
              const imgAspectRatio = imgProps.width / imgProps.height;
              const pdfAspectRatio = pdfWidth / pdfHeight;
              
              let finalWidth, finalHeight, offsetX = 0, offsetY = 0;
              
              if (imgAspectRatio > pdfAspectRatio) {
                // La imagen es más ancha que el PDF
                finalWidth = pdfWidth;
                finalHeight = pdfWidth / imgAspectRatio;
                offsetY = (pdfHeight - finalHeight) / 2; // Centrar verticalmente
              } else {
                // La imagen es más alta que el PDF
                finalHeight = pdfHeight;
                finalWidth = pdfHeight * imgAspectRatio;
                offsetX = (pdfWidth - finalWidth) / 2; // Centrar horizontalmente
              }
              
              console.log(`Imagen ${i+1} ajustada:`, {
                finalWidth,
                finalHeight,
                offsetX,
                offsetY
              });
              
              // 🔧 OPCIÓN 2: Mantener aspecto ratio y centrar
              pdf.addImage(
                images[i],
                'JPEG',
                offsetX,
                offsetY,
                finalWidth,
                finalHeight,
                undefined,
                'FAST'
              );
            }
            
            // Generar blob del PDF
            const pdfBlob = pdf.output('blob');
            const pdfFileName = `${safeClient}-cotizacion.pdf`;
            
            // Verificar si se puede compartir
            const can = await Share.canShare();
            
            // Para web, siempre descargar
            if (Capacitor.getPlatform() === 'web') {
              // 🌐 Web: descargar PDF
              console.log("[Hoja] Descargando PDF en web");
              const pdfUrl = URL.createObjectURL(pdfBlob);
              const a = document.createElement("a");
              a.href = pdfUrl;
              a.download = pdfFileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(pdfUrl);
            } else if (can.value) {
              // 📱 Dispositivo nativo: compartir PDF
              console.log("[Hoja] Compartiendo PDF en dispositivo nativo");
              
              // Convertir PDF a base64
              const base64Pdf = await blobToBase64(pdfBlob);
              const base64Data = base64Pdf.split(',')[1];
              
              // Guardar PDF temporalmente
              await Filesystem.writeFile({
                path: pdfFileName,
                data: base64Data,
                directory: Directory.Cache,
              });

              const uriResult = await Filesystem.getUri({
                path: pdfFileName,
                directory: Directory.Cache,
              });

              // Compartir PDF
              await Share.share({
                title: "Hoja de cotización",
                text: `Cotización de ${quoteForExport.client || ""} (${images.length} páginas)`,
                files: [uriResult.uri],
                dialogTitle: "Compartir cotización (PDF)",
              });
            }
          } else {
            // 🖼️ UNA SOLA PÁGINA: Mantener comportamiento original (JPG)
            console.log("[Hoja] Compartiendo imagen JPG (una página)");
            
            // Para web, descargar directamente
            if (Capacitor.getPlatform() === 'web') {
              const fileName = `${safeClient}-cotizacion.jpg`;
              const a = document.createElement("a");
              a.href = images[0];
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } else {
              const can = await Share.canShare();
              if (can.value) {
                const fileUris: string[] = [];
                const fileName = `${safeClient}-cotizacion.jpg`;
                
                const base64Data = images[0].split(",")[1];
                
                await Filesystem.writeFile({
                  path: fileName,
                  data: base64Data,
                  directory: Directory.Cache,
                });

                const uriResult = await Filesystem.getUri({
                  path: fileName,
                  directory: Directory.Cache,
                });

                fileUris.push(uriResult.uri);

                await Share.share({
                  title: "Hoja de cotización",
                  text: `Cotización de ${quoteForExport.client || ""}`,
                  files: fileUris,
                  dialogTitle: "Compartir cotización",
                });
              } else {
                // Fallback: abrir imagen en nueva pestaña
                window.open(images[0], "_blank");
              }
            }
          }
        }
      } catch (err) {
        console.error("[Hoja] Error al exportar la cotización:", err);
        console.error("[Hoja] Error detallado:", err);
        alert("Ocurrió un error al exportar la cotización: " + (err as Error).message);
      } finally {
        setExportAction(null);
        setQuoteForExport(null);
        setExportMode(false);
      }
    };

    runExport();
  }, [quoteForExport, exportAction, exportMode]);

  // ─────────────────────────────────────────────
  // Función para verificar si hay piezas que exceden el límite
  // ─────────────────────────────────────────────

  const hasExceededCharLimit = () => {
    return quoteData.pieces.some(piece => piece.length > 49);
  };

  // ─────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────

  return (
    <div className="quote-sheet-home">
      <div className="quote-sheet-home__topbar">
        <div className="qsh-topbar-left">
          <button className="qsh-topbar-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>

          {savedQuotes.length > 0 && (
            <button
              className={
                isFixedDataComplete
                  ? "qsh-topbar-pill qsh-topbar-fixed-data qsh-topbar-fixed-data--complete"
                  : "qsh-topbar-pill qsh-topbar-fixed-data"
              }
              onClick={handleFixedDataClick}
            >
              {fixedDataButtonLabel}
            </button>
          )}
        </div>

        {savedQuotes.length === 0 ? (
          <button
            className={
              isFixedDataComplete
                ? "qsh-topbar-fixed-data qsh-topbar-fixed-data--complete"
                : "qsh-topbar-fixed-data"
            }
            onClick={handleFixedDataClick}
          >
            {fixedDataButtonLabel}
          </button>
        ) : (
          <button
            className="qsh-topbar-pill qsh-topbar-new-quote"
            onClick={handleNewQuoteClick}
          >
            + Nueva hoja de cotizacion
          </button>
        )}
      </div>

      <div className="quote-sheet-home__content">
        {savedQuotes.length === 0 ? (
          <div className="qsh-empty">
            <button
              className="qsh-new-quote-btn"
              onClick={handleNewQuoteClick}
            >
              + Nueva hoja de cotizacion
            </button>
          </div>
        ) : (
          <div className="qsh-list">
            {savedQuotes.map((q) => (
              <div key={q.id} className="qsh-quote-card">
                <div className="qsh-quote-main">
                  <div className="qsh-quote-client">
                    {q.client || "Sin nombre"}
                  </div>
                  <div className="qsh-quote-meta">
                    <span>{formatDate(q.date)}</span>
                    <span className="qsh-quote-total">
                      TOTAL: {formatTotal(q.total)}
                    </span>
                  </div>
                </div>

                <div className="qsh-quote-actions">
                  <button
                    className="qsh-quote-action-btn"
                    onClick={() => handleEditQuote(q)}
                    aria-label="Editar hoja de cotización"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="qsh-quote-action-btn"
                    onClick={() => handleViewQuote(q)}
                    aria-label="Ver hoja de cotización"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="qsh-quote-action-btn"
                    onClick={() => handleDownloadQuote(q)}
                    aria-label="Guardar en galería"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="qsh-quote-action-btn"
                    onClick={() => handleShareQuote(q)}
                    aria-label="Compartir hoja de cotización"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    className="qsh-quote-action-btn qsh-quote-action-btn--danger"
                    onClick={() => handleDeleteQuote(q)}
                    aria-label="Eliminar hoja de cotización"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quote-sheet-home__bottombar" />

      <div
        ref={exportContainerRef}
        className={
          exportMode
            ? "qsh-export-container qsh-export-mode"
            : "qsh-export-container"
        }
        aria-hidden="true"
      >
        {quoteForExport && renderQuotePages(quoteForExport)}
      </div>

      {showFixedDataModal && (
        <div className="qsh-modal-overlay">
          <div className="qsh-modal">
            <div className="qsh-modal-header">
              <h2 className="qsh-modal-title">Tus datos</h2>
              <button
                className="qsh-modal-close"
                onClick={() => setShowFixedDataModal(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFixedDataSubmit} className="qsh-modal-body">
              <div className="qsh-field">
                <label className="qsh-label">Nombre de la empresa</label>
                <input
                  type="text"
                  name="companyName"
                  value={fixedData.companyName}
                  onChange={handleFixedInputChange}
                  className="qsh-input"
                />
              </div>

              <div className="qsh-two-columns">
                <div className="qsh-field">
                  <label className="qsh-label">Localidad</label>
                  <input
                    type="text"
                    name="locality"
                    value={fixedData.locality}
                    onChange={handleFixedInputChange}
                    className="qsh-input"
                  />
                </div>
                <div className="qsh-field">
                  <label className="qsh-label">C.P.</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={fixedData.postalCode}
                    onChange={handleFixedInputChange}
                    className="qsh-input"
                  />
                </div>
              </div>

              <div className="qsh-two-columns">
                <div className="qsh-field">
                  <label className="qsh-label">Calle</label>
                  <input
                    type="text"
                    name="street"
                    value={fixedData.street}
                    onChange={handleFixedInputChange}
                    className="qsh-input"
                  />
                </div>
                <div className="qsh-field">
                  <label className="qsh-label">No.</label>
                  <input
                    type="text"
                    name="streetNumber"
                    value={fixedData.streetNumber}
                    onChange={handleFixedInputChange}
                    className="qsh-input"
                  />
                </div>
              </div>

              <div className="qsh-field">
                <label className="qsh-label">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={fixedData.phone}
                  onChange={handleFixedInputChange}
                  className="qsh-input"
                />
              </div>

              <div className="qsh-field">
                <label className="qsh-label">
                  Logo (recomendado aprox. 300x300 px)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {fixedData.logoPreview && (
                  <div className="qsh-logo-preview-wrapper">
                    <img
                      src={fixedData.logoPreview}
                      alt="Vista previa del logo"
                      className="qsh-logo-preview"
                    />
                  </div>
                )}
              </div>

              <div className="qsh-field">
                <label className="qsh-label">Color de la hoja</label>
                <div className="qsh-sheet-color-grid">
                  {SHEET_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={
                        fixedData.sheetColor === color.id
                          ? "qsh-sheet-color-swatch qsh-sheet-color-swatch--active"
                          : "qsh-sheet-color-swatch"
                      }
                      style={{ backgroundColor: color.hex }}
                      onClick={() =>
                        setFixedData((prev) => ({
                          ...prev,
                          sheetColor: color.id,
                        }))
                      }
                      aria-label={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="qsh-modal-actions">
                <button
                  type="button"
                  className="qsh-btn-ghost"
                  onClick={() => setShowFixedDataModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="qsh-btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <div className="qsh-modal-overlay">
          <div className="qsh-modal">
            <div className="qsh-modal-header">
              <h2 className="qsh-modal-title">
                {editingQuoteId
                  ? "Editar hoja de cotización"
                  : "Nueva hoja de cotización"}
              </h2>
              <button
                className="qsh-modal-close"
                onClick={closeQuoteModal}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="qsh-modal-body">
              <div className="qsh-two-columns">
                <div className="qsh-field">
                  <label className="qsh-label">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={quoteData.date}
                    onChange={handleQuoteInputChange}
                    className="qsh-input"
                  />
                </div>
                <div className="qsh-field">
                  <label className="qsh-label">Cliente</label>
                  <input
                    type="text"
                    name="client"
                    value={quoteData.client}
                    onChange={handleQuoteInputChange}
                    className="qsh-input"
                  />
                </div>
              </div>

              <div className="qsh-field">
                <label className="qsh-label">
                  Piezas (agrega una por línea)
                </label>
                {quoteData.pieces.map((piece, index) => (
  <div className="qsh-piece-row qsh-piece-row--with-trash" key={index}>
    <input
      type="text"
      value={piece}
      onChange={(e) =>
        handlePieceChange(index, e.target.value)
      }
      className="qsh-input qsh-piece-input qsh-piece-input--with-trash"
      placeholder={`Pieza ${index + 1}`}
    />

    {quoteData.pieces.length > 1 && (
      <button
        type="button"
        className="qsh-piece-trash-btn"
        onClick={() => handleRemovePiece(index)}
        aria-label="Eliminar pieza"
      >
        🗑️
      </button>
    )}
  </div>
))}
                <button
                  type="button"
                  className="qsh-btn-secondary"
                  onClick={handleAddPiece}
                >
                  + Agregar pieza
                </button>
                
                {/* Aviso que aparece solo cuando se excede el límite */}
                {hasExceededCharLimit() && (
                  <div className="qsh-char-limit-warning">
                    ⚠️Toma en cuenta no exceder mas de 49 caracteres por pieza en una sola hoja para un mejor diseño.
                  </div>
                )}
              </div>

              <div className="qsh-field">
                <label className="qsh-label">Total</label>
                <input
                  type="number"
                  name="total"
                  value={quoteData.total}
                  onChange={handleQuoteInputChange}
                  className="qsh-input"
                />
              </div>

              <div className="qsh-modal-actions">
                <button
                  type="button"
                  className="qsh-btn-ghost"
                  onClick={closeQuoteModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="qsh-btn-primary">
                  {editingQuoteId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewQuote && (() => {
        // Calcular número de páginas para aplicar clase condicional
        const pieces = previewQuote.pieces
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        const totalPages = Math.max(
          1,
          Math.ceil(pieces.length / PIECES_PER_PAGE)
        );
        const previewContentClass = totalPages > 1 
          ? "qsh-preview-content qsh-multiple-pages" 
          : "qsh-preview-content qsh-single-page";

        return (
          <div className="qsh-preview-overlay">
            <div className="qsh-preview">
              <div className="qsh-preview-topbar">
                <button
                  className="qsh-topbar-btn"
                  onClick={() => setPreviewQuote(null)}
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className={previewContentClass}>
                <h1 className="qsh-preview-heading">
                  Vista previa de la cotización
                </h1>

                {renderQuotePages(previewQuote)}
              </div>

              <div className="qsh-preview-bottombar" />
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default QuoteSheetHome;