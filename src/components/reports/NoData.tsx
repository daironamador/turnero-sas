
import React from 'react';

interface NoDataProps {
  loading: boolean;
}

const NoData: React.FC<NoDataProps> = ({ loading }) => {
  return (
    <div className="text-center py-8 text-gray-500">
      {loading 
        ? 'Cargando datos...' 
        : 'Genere un reporte para ver los datos de tickets'}
    </div>
  );
};

export default NoData;
