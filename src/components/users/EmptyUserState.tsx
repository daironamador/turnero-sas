
import React from 'react';
import { Plus, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyUserStateProps {
  onCreateUser: () => void;
}

const EmptyUserState: React.FC<EmptyUserStateProps> = ({ onCreateUser }) => {
  return (
    <Card className="border-dashed bg-muted/50">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-center">No hay usuarios configurados</p>
        <p className="text-muted-foreground text-center mt-1 mb-4">
          Cree su primer usuario para comenzar a gestionar el sistema
        </p>
        <Button onClick={onCreateUser}>
          <Plus className="mr-2 h-4 w-4" /> Crear Usuario
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyUserState;
