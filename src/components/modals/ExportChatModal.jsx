import React from 'react';
import { X, FileText, Download, Printer, FileCode } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { exportChatAsTxt, exportChatAsDoc, exportChatAsPdf } from '../../utils/chatExport';

const ExportChatModal = ({ isOpen, onClose, contact, messages, currentUser }) => {
  if (!isOpen) return null;

  const handleExport = (format) => {
    if (format === 'txt') {
      exportChatAsTxt(contact, messages, currentUser);
    } else if (format === 'doc') {
      exportChatAsDoc(contact, messages, currentUser);
    } else if (format === 'pdf') {
      exportChatAsPdf(contact, messages, currentUser);
    }
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card border border-border/60 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Export Chat</h3>
                <p className="text-xs text-muted-foreground">Download conversation history</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Export {messages?.length || 0} messages with <strong className="text-foreground">{contact?.name || 'Contact'}</strong> in your preferred format:
            </p>

            {/* Option 1: PDF */}
            <button
              onClick={() => handleExport('pdf')}
              className="w-full p-3.5 rounded-2xl border border-border/60 hover:border-red-500/50 hover:bg-red-500/5 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground group-hover:text-red-500 transition-colors">Export as PDF (.pdf)</h4>
                <p className="text-[11px] text-muted-foreground">Printable document formatted with bubbles & avatars</p>
              </div>
            </button>

            {/* Option 2: DOC */}
            <button
              onClick={() => handleExport('doc')}
              className="w-full p-3.5 rounded-2xl border border-border/60 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground group-hover:text-blue-500 transition-colors">Word Document (.doc)</h4>
                <p className="text-[11px] text-muted-foreground">Microsoft Word formatted document with styles</p>
              </div>
            </button>

            {/* Option 3: TXT */}
            <button
              onClick={() => handleExport('txt')}
              className="w-full p-3.5 rounded-2xl border border-border/60 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground group-hover:text-purple-600 transition-colors">Text File (.txt)</h4>
                <p className="text-[11px] text-muted-foreground">Lightweight plain text log with timestamps</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default ExportChatModal;
