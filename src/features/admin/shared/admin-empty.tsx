export function AdminEmpty({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-medium text-slate-900">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p></div>;
}
