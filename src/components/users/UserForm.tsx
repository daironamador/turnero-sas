
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { User, Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  username: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }),
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  role: z.enum(['admin', 'operator', 'viewer'], {
    required_error: 'Debe seleccionar un rol',
  }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional(),
  confirmPassword: z.string().optional(),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string()).optional(),
}).refine(data => {
  // When creating a new user, password is required
  if (!data.password && !data.confirmPassword) return true;
  return data.password === data.confirmPassword;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

interface UserFormProps {
  user?: User;
  services: Service[];
  onSave: (data: Partial<User>, password?: string) => void;
  onCancel: () => void;
  isCreating?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  services, 
  onSave, 
  onCancel,
  isCreating = false
}) => {
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with user data or defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      role: (user?.role as 'admin' | 'operator' | 'viewer') || 'operator',
      password: '',
      confirmPassword: '',
      isActive: user?.isActive !== undefined ? user.isActive : true,
      serviceIds: user?.serviceIds || [],
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      
      // For new users, validate password
      if (isCreating && (!values.password || values.password.length < 6)) {
        setError('Se requiere una contraseña de al menos 6 caracteres');
        return;
      }

      // If passwords are present but don't match
      if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      
      const userData: Partial<User> = {
        name: values.name,
        username: values.username,
        email: values.email,
        role: values.role,
        isActive: values.isActive,
        serviceIds: values.serviceIds || [],
      };
      
      onSave(userData, values.password);
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    }
  };

  const roleDescriptions = {
    admin: 'Acceso completo a todas las funciones del sistema',
    operator: 'Puede atender tickets y ver reportes',
    viewer: 'Solo puede ver reportes y pantallas de visualización'
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre del usuario" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre único para iniciar sesión" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="correo@ejemplo.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Rol de Usuario</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  {(['admin', 'operator', 'viewer'] as const).map(role => (
                    <div key={role} className="flex items-start space-x-2 border p-3 rounded-md">
                      <RadioGroupItem value={role} id={`role-${role}`} />
                      <div className="grid gap-1">
                        <label
                          htmlFor={`role-${role}`}
                          className="font-medium leading-none capitalize"
                        >
                          {role === 'admin' ? 'Administrador' : 
                           role === 'operator' ? 'Operador' : 'Visualizador'}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {roleDescriptions[role]}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isCreating && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="Repita la contraseña" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Usuario Activo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Solo los usuarios activos pueden iniciar sesión y usar el sistema
                </p>
              </div>
            </FormItem>
          )}
        />
        
        {(form.watch('role') === 'operator') && (
          <FormField
            control={form.control}
            name="serviceIds"
            render={() => (
              <FormItem>
                <div className="mb-2">
                  <FormLabel className="text-base">Servicios Asignados</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Seleccione los servicios que este operador podrá atender
                  </p>
                </div>
                {services.map((service) => (
                  <FormField
                    key={service.id}
                    control={form.control}
                    name="serviceIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={service.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value || [], service.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== service.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {service.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="bg-ocular-600 hover:bg-ocular-700"
          >
            {isCreating ? 'Crear Usuario' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;
