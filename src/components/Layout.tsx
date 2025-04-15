
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MedicalDisclaimer from './MedicalDisclaimer';

interface LayoutProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

const Layout = ({ children, showDisclaimer = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        {showDisclaimer && <MedicalDisclaimer />}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
