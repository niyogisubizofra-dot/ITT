import { useState } from 'react';
import { X, Copy } from 'lucide-react';
import Logo from './Logo';

const DepositModal = ({ open, onClose, onDeposit, requiredAmount, requiredFor }) => {
  const [step, setStep] = useState('select'); // 'select' | 'qr' | 'upload'
  const [selected, setSelected] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);

  if (!open) return null;

  const handleClose = () => {
    // Reset state when closing
    setStep('select');
    setSelected(null);
    setScreenshotPreview(null);
    setScreenshotFile(null);
    onClose && onClose();
  };

  const networks = [
    {
      id: 'bep20-usdt',
      label: 'BEP20-USDT',
      subtitle: 'BNB Smart Chain',
      address: '0x350A191e8B67Cd048574c7C876045C9418a00000',
      logo: '/assets/usdt.png',
    },
  ];

  const openNetwork = (net) => {
    setSelected(net);
    setStep('qr');
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Address copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDone = () => {
    onDeposit && onDeposit();
    // move to upload step so user can attach screenshot and notify admin
    setStep('upload');
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setScreenshotFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const copyImageToClipboard = async () => {
    if (!screenshotPreview) return alert('No screenshot to copy');
    try {
      const res = await fetch(screenshotPreview);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert('Screenshot copied to clipboard — paste into WhatsApp chat (Ctrl+V)');
    } catch (err) {
      console.error('Copy to clipboard failed', err);
      alert('Copy failed — please save the image and attach manually.');
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose}></div>
      <div className="relative bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg font-bold flex items-center">Deposit</h3>
            {requiredAmount && (
              <p className="text-sm text-slate-400 mt-1">
                You need <span className="font-bold text-emerald-300">${requiredAmount}</span> more to invest in <span className="font-semibold text-white">{requiredFor}</span>.
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/5"><X className="w-4 h-4"/></button>
        </div>

        {step === 'select' && (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-slate-300">Choose a network to deposit</p>
            {networks.map((n) => (
              <button key={n.id} onClick={() => openNetwork(n)} className="w-full bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between hover:scale-[1.01] transition">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Logo size={28} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-black text-sm sm:text-base truncate">{n.label}</div>
                    <div className="text-xs text-slate-400 truncate">{n.subtitle}</div>
                  </div>
                </div>
                <div className="text-slate-400">›</div>
              </button>
            ))}
          </div>
        )}

        {step === 'qr' && selected && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
              <div className="flex items-center justify-center mb-2 sm:mb-3 flex-wrap gap-2">
                <Logo size={24} />
                <div className="font-black text-white text-sm sm:text-base">{selected.label}</div>
              </div>
              <div className="mx-auto w-40 h-40 sm:w-44 sm:h-44 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(selected.address)}`} alt="qr" className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-slate-400 mb-2">Deposit address</div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl gap-2">
                <div className="truncate text-xs sm:text-sm break-all sm:break-normal">{selected.address}</div>
                <button onClick={() => handleCopy(selected.address)} className="text-emerald-400 font-bold flex items-center justify-center sm:ml-2 py-1.5 sm:py-0 px-2 bg-slate-700 sm:bg-transparent rounded sm:rounded-none whitespace-nowrap text-xs sm:text-sm">
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Copy
                </button>
              </div>
            </div>

            <button onClick={handleDone} className="mt-2 w-full bg-emerald-400 text-slate-900 font-black py-2 sm:py-3 rounded-lg sm:rounded-2xl text-sm sm:text-base">Deposit done</button>

            <div className="text-xs text-slate-400 bg-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <p className="font-bold text-white mb-1 sm:mb-2">{selected.label}</p>
              <ol className="list-decimal list-inside space-y-0.5 sm:space-y-1 text-[11px] sm:text-xs">
                <li>Copy the address above or scan the QR code and choose the BNB Smart Chain network to deposit USDT.</li>
                <li>After recharging, the funds will arrive in about 1-10 minutes. If the funds do not arrive for a long time, please refresh the page or contact support.</li>
              </ol>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-bold text-sm sm:text-base">Upload deposit screenshot</h4>
            <p className="text-xs sm:text-sm text-slate-400">Attach your transaction screenshot so admin can verify the deposit.</p>

            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs sm:text-sm text-slate-300 w-full" />
              {screenshotPreview && (
                <div className="mt-2">
                  <img src={screenshotPreview} alt="preview" className="w-full rounded-lg sm:rounded-xl border border-slate-700" />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={copyImageToClipboard} className="w-full bg-slate-800 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-slate-700 transition font-bold text-xs sm:text-sm">
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" /> Copy Screenshot
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              Copy your screenshot to clipboard and submit it to the admin. Your deposit will be processed within 1-10 minutes.
            </div>

            <button
              onClick={() => {
                onDeposit && onDeposit();
                setStep('select');
                setSelected(null);
                setScreenshotPreview(null);
                setScreenshotFile(null);
              }}
              className="w-full mt-4 bg-emerald-500 text-slate-900 font-bold py-2 sm:py-3 rounded-lg sm:rounded-2xl hover:bg-emerald-600 transition text-sm sm:text-base"
            >
              Deposit Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
