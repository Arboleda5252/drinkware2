import "./globals.css";
import Nav from './ui/nav';
import Footer from './ui/footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main> {/*Contenedor principal */}
        <Footer />
      </body>
    </html>
  );
}