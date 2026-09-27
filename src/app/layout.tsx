import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-w-0 overflow-x-hidden">{children}</body>
    </html>
  );
}