import PageHeader from '@/components/speaking/PageHeader';
import FaithJournal from '@/components/faith/FaithJournal';

export default function Faith() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Faith" isRootTab />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-9">
        <FaithJournal />
        <div className="h-28 lg:hidden" />
      </div>
    </main>
  );
}