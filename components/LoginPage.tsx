
import React, { useState, useEffect, useRef } from 'react';
import { login } from '../services/authService';
import type { User } from '../types/index';

const Spinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


export const LoginPage: React.FC<{ onLoginSuccess: (user: User) => void; }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: 'username' | 'password', value: string): string => {
      if (!value.trim()) {
          if (name === 'username') return 'UserID cannot be empty.';
          if (name === 'password') return 'Password cannot be empty.';
      }
      return '';
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target as { name: 'username' | 'password', value: string };
      if (!touched[name]) {
          setTouched(prev => ({ ...prev, [name]: true }));
      }
      const validationError = validateField(name, value);
      setErrors(prev => ({...prev, [name]: validationError }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as { name: 'username' | 'password', value: string };
      
      if (name === 'username') setUsername(value);
      if (name === 'password') setPassword(value);

      if (touched[name]) {
          const validationError = validateField(name, value);
          setErrors(prev => ({...prev, [name]: validationError }));
      }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          passwordInputRef.current?.focus();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    
    // Mark all as touched to show errors on empty submit attempt
    setTouched({ username: true, password: true });

    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);
    
    setErrors({ username: usernameError, password: passwordError });
    
    if (usernameError || passwordError) {
        return;
    }

    setIsLoading(true);
    try {
      const user = await login(username, password);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('An unknown error occurred.');
      }
      setShake(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shake) {
        const timer = setTimeout(() => setShake(false), 820); // Duration of the shake animation
        return () => clearTimeout(timer);
    }
  }, [shake]);

  const getFieldState = (field: 'username' | 'password'): 'default' | 'error' | 'success' => {
      const value = field === 'username' ? username : password;
      if (touched[field] && errors[field]) return 'error';
      if (touched[field] && !errors[field] && value) return 'success';
      return 'default';
  };
  
  const getInputBorderClass = (field: 'username' | 'password') => {
      const state = getFieldState(field);
      const baseFocus = 'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/40';
      switch(state) {
          case 'error': return `border-red-500/60 ${baseFocus}`;
          case 'success': return `border-green-500/60 ${baseFocus}`;
          default: return `border-white/10 ${baseFocus}`;
      }
  };
  
  const getInputIconClass = (field: 'username' | 'password') => {
      const state = getFieldState(field);
      switch(state) {
          case 'error': return 'text-red-400';
          case 'success': return 'text-green-400';
          default: return 'text-gray-400';
      }
  };

  return (
    <>
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-gray-950 login-background">
        <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="flex-col items-center md:items-start text-center md:text-left hidden md:flex fade-in-up">
                <div className="flex items-center gap-4 mb-6 drop-shadow-lg">
                    <Logo className="h-16 w-16 text-[var(--color-accent)]" />
                    <h1 className="text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400" style={{textShadow: '0 2px 20px rgba(0,0,0,0.5)'}}>Loki Gallery</h1>
                </div>
                <p className="text-2xl text-gray-300 max-w-lg leading-relaxed" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
                    Your memories, framed in elegance. 
                    <br/>
                    A secure portal for creative collaboration.
                </p>
            </div>

            <div className={`w-full max-w-md p-8 space-y-6 bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 ${shake ? 'animate-shake' : ''}`}>
                <div className="text-center fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex md:hidden items-center justify-center gap-3 mb-4">
                        <Logo className="h-8 w-8 text-[var(--color-accent)]" />
                        <h1 className="text-3xl font-bold text-white">Loki Gallery</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Client Access Portal</h2>
                    <p className="text-sm text-gray-400 mt-1">Please log in to view your collection.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
                        <label htmlFor="username" className="text-sm font-medium text-gray-300">
                        UserID
                        </label>
                        <div className="relative mt-2">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${getInputIconClass('username')}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                            id="username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleUsernameKeyDown}
                            required
                            className={`block w-full px-4 py-3 pl-10 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-all duration-300 ${getInputBorderClass('username')}`}
                            placeholder="User ID"
                            aria-invalid={!!errors.username}
                            aria-describedby="username-error"
                            />
                        </div>
                        {touched.username && errors.username && (
                             <p id="username-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1 fade-in-up">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {errors.username}
                            </p>
                        )}
                    </div>
                    <div className="fade-in-up" style={{ animationDelay: '300ms' }}>
                        <label htmlFor="password" className="text-sm font-medium text-gray-300">
                        Password
                        </label>
                        <div className="relative mt-2">
                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${getInputIconClass('password')}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                ref={passwordInputRef}
                                id="password"
                                name="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className={`block w-full px-4 py-3 pl-10 pr-10 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-all duration-300 ${getInputBorderClass('password')}`}
                                placeholder="Password"
                                aria-invalid={!!errors.password}
                                aria-describedby="password-error"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                                {isPasswordVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.042 10.042 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                                ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                )}
                            </button>
                        </div>
                        {touched.password && errors.password && (
                            <p id="password-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1 fade-in-up">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {errors.password}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-end text-sm fade-in-up" style={{ animationDelay: '400ms' }}>
                        <a href="#" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition">
                            Forgot password?
                        </a>
                    </div>
                    {apiError && (
                        <div className="flex items-center gap-3 p-3 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 fade-in-up" style={{ animationDelay: '500ms' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{apiError}</span>
                        </div>
                    )}
                    <div className="pt-2">
                         <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:shadow-[var(--color-accent-glow)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] focus:ring-offset-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 fade-in-up"
                            style={{ animationDelay: '500ms' }}
                        >
                            {isLoading ? <Spinner /> : 'View My Gallery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </>
  );
};
