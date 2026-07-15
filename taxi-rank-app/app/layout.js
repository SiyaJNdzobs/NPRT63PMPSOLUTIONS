import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "E-Rank - Digital Taxi Rank Management System",
  description: "Efficient queue, fleet, passenger and marshal management for the South African minibus taxi industry.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
