
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const DisplayHeader: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-ocular-600 text-white p-6">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold">Centro Oftalmológico</h1>
        <div className="text-xl font-medium">{format(currentTime, "HH:mm - EEEE, dd 'de' MMMM, yyyy")}</div>
      </div>
    </div>
  );
};

export default DisplayHeader;
