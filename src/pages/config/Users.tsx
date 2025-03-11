
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import UserForm from '@/components/users/UserForm';
import UserCard from '@/components/users/UserCard';
import EmptyUserState from '@/components/users/EmptyUserState';
import { useUserManagement } from '@/hooks/users/useUserManagement';

const Users: React.FC = () => {
  const {
    users,
    services,
    loading,
    error,
    isDialogOpen,
    currentUser,
    setIsDialogOpen,
    setCurrentUser,
    handleSaveUser,
    toggleUserStatus,
    openEditDialog,
    createUserDialog
  } = useUserManagement();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link 
              to="/config" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Configuración
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestione los usuarios y sus permisos en el sistema
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={createUserDialog}
                className="bg-ocular-600 hover:bg-ocular-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {currentUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {currentUser
                    ? 'Modifique los datos del usuario existente'
                    : 'Complete los datos para crear un nuevo usuario'}
                </DialogDescription>
              </DialogHeader>
              
              <UserForm 
                user={currentUser}
                services={services}
                onSave={handleSaveUser}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setCurrentUser(undefined);
                }}
                isCreating={!currentUser}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : users.length === 0 ? (
          <EmptyUserState onCreateUser={createUserDialog} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={openEditDialog}
                onToggleStatus={toggleUserStatus}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Users;
