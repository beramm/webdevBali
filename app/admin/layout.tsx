export const metadata = {
  title: "Admin — Website Developer Bali",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-svh bg-zinc-950 text-zinc-100">{children}</div>;
}
