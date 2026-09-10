import 'animate.css';
import "@/styles/globals.css";
import Providers from "@/components/providers";
import ErrorBoundary from "@/components/error-boundary";

const bodyFontClass = "font-sans";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFontClass} h-full antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
