// Combined login and registration page component
import { useState, FormEvent } from 'react';
import axios from '../lib/axios';

export default function LoginPage() {
  // Main states for controlling page mode and loading status
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data state for both login and registration
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  });

  // Password reset functionality states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password validation tracking for registration
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  // Handle input changes for all form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password validation states in real-time
    if (name === 'password') {
      setPasswordValidation({
        length: value.length >= 6,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value)
      });
    }
  };

// List of authorized domains that are allowed to register
const ALLOWED_DOMAINS = [
  'ibc-international.se',
  'ledel.se',
  'vinbergsmek.se',
  'randek.com',
  'cleverkey.se',
  'fa-tec.se',
  'tomal.se',
  'el-andersson.se',
  'systemhall.com',
  'falkenbergssparbank.se',
  'falkenberg.se'
];

// Handle form submission for both login and registration
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    if (isRegistering) {
      // For registration: first validate password requirements
      if (!Object.values(passwordValidation).every(Boolean)) {
        setError('Lösenordet uppfyller inte alla krav');
        setIsLoading(false);
        return;
      }

      // Extract and validate the email domain
      const domain = formData.email.split('@')[1]?.toLowerCase();
      if (!ALLOWED_DOMAINS.includes(domain)) {
        setError('Endast företagskonton från godkända domäner kan registrera sig. Kontakta administratören om du behöver hjälp.');
        setIsLoading(false);
        return;
      }

      // If domain is valid, proceed with registration
      await axios.post('/api/account/register', formData);
      
      // After successful registration, automatically log the user in
      const loginResponse = await axios.post('/api/account/login', {
        email: formData.email,
        password: formData.password
      });

      // Store the token and redirect to calendar
      localStorage.setItem('token', loginResponse.data.token);
      window.location.href = '/calendar';
    } else {
      // For login: simply attempt to log in with provided credentials
      const response = await axios.post('/api/account/login', {
        email: formData.email,
        password: formData.password
      });

      // Store the token and redirect to calendar
      localStorage.setItem('token', response.data.token);
      window.location.href = '/calendar';
    }
  } catch (error: any) {
    // Handle any errors that occur during login/registration
    setError(error.response?.data || `Ett fel uppstod vid ${isRegistering ? 'registrering' : 'inloggning'}`);
  } finally {
    // Always reset loading state when done
    setIsLoading(false);
  }
};

  // Handle password reset request submission
  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/account/forgot-password', { email: resetEmail });
      setResetSuccess(true);
    } catch (error: any) {
      setError(error.response?.data || 'Ett fel uppstod vid återställning av lösenord');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switch between login and registration modes
  const handleModeSwitch = () => {
    setIsRegistering(!isRegistering);
    setError('');
    // Reset form data and validation states
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
    });
    setPasswordValidation({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false
    });
  };
// Main component render
return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
    {/* Main container with glassmorphism effect */}
    <div className="max-w-md w-full bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-8 space-y-6">
      {/* Dynamic header section */}
      <div>
        <h2 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
          {isForgotPassword 
            ? resetSuccess 
              ? 'Mail skickat'
              : 'Återställ lösenord'
            : 'Robot Bokning'
          }
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {isForgotPassword
            ? resetSuccess
              ? 'Om emailadressen finns i vårt system kommer du få instruktioner för att återställa ditt lösenord.'
              : 'Ange din email för att återställa lösenordet'
            : isRegistering
              ? 'Skapa ett nytt konto'
              : 'Logga in för att hantera bokningar'
          }
        </p>
      </div>

      {/* Error message display */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Password reset form handling */}
      {isForgotPassword ? (
        resetSuccess ? (
          // Success state with return button
          <div>
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setResetSuccess(false);
                setResetEmail('');
              }}
              className="w-full flex justify-center py-2 px-4 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-200"
            >
              Tillbaka till inloggning
            </button>
          </div>
        ) : (
          // Password reset form
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Skickar...' : 'Skicka återställningslänk'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmail('');
                  setError('');
                }}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium"
              >
                Tillbaka till inloggning
              </button>
            </div>
          </form>
        )
      ) : (
        <>
          {/* Main login/registration form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Registration-specific fields */}
            {isRegistering && (
              <div className="space-y-6">
                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Förnamn
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Efternamn
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Contact and company fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefonnummer
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Företag
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common fields for both login and registration */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            {/* Password field with validation display */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                value={formData.password}
                onChange={handleChange}
              />
              
              {/* Password requirements checklist for registration */}
              {isRegistering && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">Lösenordet måste innehålla:</p>
                  <ul className="text-sm space-y-1">
                    {[
                      { key: 'length', text: 'Minst 6 tecken' },
                      { key: 'uppercase', text: 'Minst en stor bokstav (A-Z)' },
                      { key: 'lowercase', text: 'Minst en liten bokstav (a-z)' },
                      { key: 'number', text: 'Minst en siffra (0-9)' }
                    ].map(({ key, text }) => (
                      <li key={key} className={`flex items-center ${passwordValidation[key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation[key as keyof typeof passwordValidation] ? '✓' : '○'} {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Arbetar...</span>
              ) : (
                <span>{isRegistering ? 'Registrera' : 'Logga in'}</span>
              )}
            </button>
          </form>

          {/* Footer navigation links */}
          <div className="text-center space-y-2">
            {/* Toggle between login and registration */}
            <button
              onClick={handleModeSwitch}
              className="text-violet-600 hover:text-violet-800 text-sm font-medium"
            >
              {isRegistering 
                ? 'Har du redan ett konto? Logga in här' 
                : 'Ny användare? Registrera dig här'}
            </button>
            
            {/* Forgot password link - only shown in login mode */}
            {!isRegistering && (
              <div>
                <button
                  onClick={() => setIsForgotPassword(true)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Glömt ditt lösenord?
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);
}