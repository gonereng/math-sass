export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
          MathSheets
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Worksheet studio
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
