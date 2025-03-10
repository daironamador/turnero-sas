
import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PatientList from '@/components/patients/PatientList';
import PatientForm from '@/components/patients/PatientForm';

const Patients: React.FC = () => {
  const { action } = useParams<{ action?: string }>();
  
  return (
    <MainLayout>
      {action === 'new' ? <PatientForm /> : <PatientList />}
    </MainLayout>
  );
};

export default Patients;
