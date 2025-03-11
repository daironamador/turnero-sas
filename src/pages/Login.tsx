
import React from 'react';
import { useLoginState } from '@/hooks/useLoginState';
import LoginForm from '@/components/auth/LoginForm';
import Spinner from '@/components/ui/spinner';

const Login = () => {
  const {
    loading,
    sessionLoading,
    email,
    setEmail,
    password,
    setPassword,
    error,
    settings,
    rememberMe,
    setRememberMe,
    handleLogin
  } = useLoginState();

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <LoginForm
        loading={loading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        handleLogin={handleLogin}
        settings={settings}
      />
    </div>
  );
};

export default Login;
