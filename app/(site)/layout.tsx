import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TopContactBar } from "@/components/ContactPhones";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopContactBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
