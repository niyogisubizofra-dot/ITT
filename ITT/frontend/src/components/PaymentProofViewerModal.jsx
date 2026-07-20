import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Download, AlertCircle, FileText, Move, Loader2 } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const PaymentProofViewerModal = ({ isOpen, onClose, proofUrl, filename, userName }) => {
  if (!isOpen || !proofUrl) return null;

  const isPdf = proofUrl.toLowerCase().endsWith('.pdf') || filename?.toLowerCase().endsWith('.pdf');

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [isOriginalSize, setIsOriginalSize] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);

  const containerRef = useRef(null);

  // Authenticated file loader (Blob URL)
  useEffect(() => {
    let isMounted = true;
    let activeBlobUrl = null;

    setScale(1);
    setPan({ x: 0, y: 0 });
    setHasError(false);
    setIsOriginalSize(false);
    setIsFullScreen(false);

    const loadProofFile = async () => {
      setLoadingFile(true);
      try {
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        const cleanUrl = proofUrl.startsWith('/') ? proofUrl : `/${proofUrl}`;
        const targetUrl = token
          ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
          : cleanUrl;

        const res = await axios.get(targetUrl, {
          responseType: 'blob',
        });

        if (isMounted) {
          const mimeType = res.headers['content-type'] || (isPdf ? 'application/pdf' : 'image/png');
          const blob = new Blob([res.data], { type: mimeType });
          activeBlobUrl = URL.createObjectURL(blob);
          setObjectUrl(activeBlobUrl);
        }
      } catch (err) {
        console.warn('Blob load failed, falling back to direct URL:', err);
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        const cleanUrl = proofUrl.startsWith('/') ? proofUrl : `/${proofUrl}`;
        const fallbackUrl = token
          ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
          : cleanUrl;

        if (isMounted) {
          setObjectUrl(fallbackUrl);
        }
      } finally {
        if (isMounted) setLoadingFile(false);
      }
    };

    loadProofFile();

    return () => {
      isMounted = false;
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [proofUrl]);

  // Handle Zoom Controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(5.0, parseFloat((prev + 0.25).toFixed(2))));
    setIsOriginalSize(false);
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.25, parseFloat((prev - 0.25).toFixed(2))));
    setIsOriginalSize(false);
  };

  const handleFitToScreen = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsOriginalSize(false);
  };

  const handleOriginalSize = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsOriginalSize(true);
  };

  // Mouse Wheel Zooming
  const handleWheel = (e) => {
    if (isPdf) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => {
      const next = Math.max(0.25, Math.min(5.0, parseFloat((prev + delta).toFixed(2))));
      return next;
    });
    setIsOriginalSize(false);
  };

  // Click & Drag (Panning) Handlers
  const handleMouseDown = (e) => {
    if (isPdf || e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Image load details
  const handleImageLoad = (e) => {
    setDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
  };

  // Download Trigger
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = proofUrl;
    a.download = filename || 'payment_proof';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md fade-in ${isFullScreen ? 'p-0' : ''}`}>
      <div
        className={`relative bg-slate-900 text-white rounded-3xl w-full border border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullScreen
            ? 'h-screen w-screen rounded-none border-none'
            : 'max-w-6xl max-h-[95vh] h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Payment Proof Verification</h3>
                {dimensions && (
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    {dimensions.width} × {dimensions.height} px
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Uploaded by <span className="font-semibold text-emerald-400">{userName || 'User'}</span> ({filename || 'Proof Screenshot'})
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {!isPdf && !hasError && (
              <>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 space-x-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-400 px-2 min-w-[50px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleFitToScreen}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                    scale === 1 && !isOriginalSize
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  Fit Screen
                </button>

                <button
                  onClick={handleOriginalSize}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                    isOriginalSize
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  100% Original
                </button>

                <button
                  onClick={() => {
                    setScale(1);
                    setPan({ x: 0, y: 0 });
                    setIsOriginalSize(false);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" /> Download
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
        >
          {/* Instructions Overlay */}
          {!isPdf && !hasError && (
            <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 text-slate-400 px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-2 pointer-events-none">
              <Move className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scroll mouse wheel to zoom • Drag to move image</span>
            </div>
          )}

          {loadingFile ? (
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-400">Loading high-resolution payment proof...</p>
            </div>
          ) : hasError ? (
            <div className="text-center p-8 space-y-4 max-w-md">
              <AlertCircle className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
              <h4 className="text-lg font-bold text-white">Unable to Preview Proof Screenshot</h4>
              <p className="text-xs text-slate-400">
                The image could not be rendered directly in the browser preview. Please download the file to inspect transaction details.
              </p>
              <button
                onClick={handleDownload}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Original File
              </button>
            </div>
          ) : isPdf ? (
            <object
              data={objectUrl || proofUrl}
              type="application/pdf"
              className="w-full h-full min-h-[600px] rounded-b-3xl"
            >
              <iframe
                src={objectUrl || proofUrl}
                title="PDF Payment Proof"
                className="w-full h-full min-h-[600px]"
              />
            </object>
          ) : (
            <div
              className="transition-transform duration-75 ease-out flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={objectUrl || proofUrl}
                alt="Payment Proof Screenshot"
                onLoad={handleImageLoad}
                onError={() => setHasError(true)}
                className={`rounded-lg shadow-2xl transition-all ${
                  isOriginalSize
                    ? 'max-w-none max-h-none'
                    : 'max-w-[85vw] max-h-[75vh] object-contain'
                }`}
                style={{
                  imageRendering: 'crisp-edges',
                  WebkitImageRendering: 'optimizeQuality',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProofViewerModal;
