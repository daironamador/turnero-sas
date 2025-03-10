
import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AppointmentList from '@/components/appointments/AppointmentList';
import AppointmentForm from '@/components/appointments/AppointmentForm';

const Appointments: React.FC = () => {
  const { action } = useParams<{ action?: string }>();
  
  return (
    <MainLayout>
      {action === 'new' ? <AppointmentForm /> : <AppointmentList />}
    </MainLayout>
  );
};

export default Appointments;
