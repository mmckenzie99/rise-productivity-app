import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/speaking/PageHeader';

export default function Faith() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Faith" isRootTab />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-primary bg-card/60 py-16 text-center">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="font-display text-xl font-semibold">Faith</h2>
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        </div>
        <div className="h-28 lg:hidden" />
      </div>
    </main>
  );
}