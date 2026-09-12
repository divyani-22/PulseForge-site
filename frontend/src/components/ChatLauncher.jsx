import { useState } from 'react';
import { Bot } from 'lucide-react';
import AIChat from './AIChat';
import { useAuth } from '../auth/AuthContext';

export default function ChatLauncher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null; // Only show when authenticated

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Open chat"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[75vh] max-h-[600px] bg-white border border-gray-200 shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden">
          <AIChat 
            patientId={user.role === 'patient' ? (user.patient_link_id || user.id) : null} 
            onClose={() => setOpen(false)} 
          />
        </div>
      )}
    </>
  );
}
