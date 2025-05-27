
import React, { useState } from 'react';
import Header from '@/components/layout/Header'; // Assuming you want the same header
import ClientList from '@/components/clients/ClientList';
import AddClientForm from '@/components/clients/AddClientForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ClientsPage: React.FC = () => {
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary">ניהול לקוחות</h1>
            <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="ml-2 h-5 w-5" />
                  הוסף לקוח חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>הוספת לקוח חדש</DialogTitle>
                </DialogHeader>
                <AddClientForm setOpen={setIsAddClientDialogOpen} />
              </DialogContent>
            </Dialog>
          </div>
          <ClientList />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default ClientsPage;
