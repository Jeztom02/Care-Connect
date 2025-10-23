import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserProfile } from '@/hooks/useApi';
import { Messages } from '@/pages/dashboard/Messages';

export const ChatLauncher = () => {
  const [open, setOpen] = useState(false);
  const { data: me } = useUserProfile();
  const role = (me as any)?.role || localStorage.getItem('userRole') || 'user';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg h-12 w-12 p-0">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh]">
            <Messages userRole={role} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
