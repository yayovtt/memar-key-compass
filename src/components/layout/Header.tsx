
import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center">
        <LayoutDashboard className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-2xl font-semibold text-primary">לוח בקרה</h1>
      </div>
    </header>
  );
};

export default Header;
