import { useEffect, useState } from 'react';
import { QrCode, Download, Copy, Check, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Modal, Button } from '../shared';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function QRCodeModal({ isOpen, onClose, productId, productName }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const productUrl = `${window.location.origin}/products/${productId}?qr=1`;

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      QRCode.toDataURL(productUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId, productUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${productName.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">Product QR Code</h2>
          <button
            onClick={onClose}
            className="p-1 text-secondary-400 hover:text-secondary-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="font-medium text-secondary-900 mb-1">{productName}</p>
          <p className="text-sm text-secondary-500">Scan to view product</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-secondary-200 flex items-center justify-center mb-6">
          {loading ? (
            <div className="w-64 h-64 flex items-center justify-center bg-secondary-100 rounded">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-secondary-100 rounded">
              <p className="text-secondary-500">Failed to generate QR code</p>
            </div>
          )}
        </div>

        <div className="bg-secondary-50 p-3 rounded-lg mb-4">
          <p className="text-xs text-secondary-500 mb-1">Product URL:</p>
          <p className="text-sm text-secondary-900 font-mono break-all">{productUrl}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCopyLink} className="flex-1">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
          <Button onClick={handleDownload} className="flex-1" disabled={!qrDataUrl}>
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface QRCodeButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QRCodeButton({ onClick, size = 'md', className = '' }: QRCodeButtonProps) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      className={className}
    >
      <QrCode className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
      QR Code
    </Button>
  );
}
