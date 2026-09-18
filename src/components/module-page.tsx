type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Module</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-xl border bg-card p-6">
        <p className="text-sm font-medium">Coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This module is part of the Life Dashboard shell and will be connected in a future task.
        </p>
      </div>
    </div>
  );
}
