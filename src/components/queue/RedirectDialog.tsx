
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Service } from '@/lib/types';

interface RedirectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedService?: string;
  onSelectService: (value: string) => void;
  onRedirect: () => void;
  services: Service[];
}

const RedirectDialog: React.FC<RedirectDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedService,
  onSelectService,
  onRedirect,
  services
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redirigir Ticket</DialogTitle>
          <DialogDescription>
            Seleccione el servicio al que desea redirigir el ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service" className="text-right">
              Servicio
            </Label>
            <Select onValueChange={onSelectService} defaultValue={selectedService}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccione un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.code}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={onRedirect}>
            Redirigir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedirectDialog;
