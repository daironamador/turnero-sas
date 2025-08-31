import React from 'react';
import { AlertCircle, Wifi, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  hasAudioError?: boolean;
  hasDatabaseError?: boolean;
  onRetry?: () => void;
  onInitializeAudio?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  hasAudioError,
  hasDatabaseError,
  onRetry,
  onInitializeAudio
}) => {
  if (!hasAudioError && !hasDatabaseError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Problemas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasDatabaseError && (
            <div className="flex items-start space-x-2">
              <Wifi className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700 font-medium">
                  Error de conexión a la base de datos
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Los datos pueden estar desactualizados. Reintentando automáticamente...
                </p>
              </div>
            </div>
          )}
          
          {hasAudioError && (
            <div className="flex items-start space-x-2">
              <Volume2 className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700 font-medium">
                  Audio no inicializado
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Los anuncios de voz no se reproducirán automáticamente
                </p>
                {onInitializeAudio && (
                  <Button
                    onClick={onInitializeAudio}
                    size="sm"
                    variant="outline"
                    className="mt-2 h-6 text-xs"
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Activar Audio
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {onRetry && (
            <div className="pt-2 border-t border-red-200">
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="h-6 text-xs w-full"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reintentar Conexión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;