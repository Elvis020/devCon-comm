import { NavPublic } from '@/components/layout/nav-public';
import { ToastProvider } from '@/components/ui/toast';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="h-screen overflow-hidden flex flex-col">
        <NavPublic />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
