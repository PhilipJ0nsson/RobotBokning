// Password reset component for handling password recovery
import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../lib/axios';

export default function ResetPasswordPage() {
  // URL parameter handling for token and email
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Form state management
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password validation tracking
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  // Handle password reset form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Send password reset request
      await axios.post('/api/account/reset-password', {
        email,
        token,
        newPassword
      });
      setSuccess(true);
    } catch (error: any) {
      console.log('Error object:', error);
      
      // Error message handling with fallbacks
      let errorMessage = 'Ett fel uppstod vid återställning av lösenord';
      
      if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const firstError = Object.values(error.response.data.errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password input with real-time validation
  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    setPasswordValidation({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    });
  };

// Render component based on state
if (!token || !email) {
  // Invalid or expired link state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ogiltig länk</h2>
        <p className="text-gray-600">
          Länken för att återställa lösenordet är ogiltig eller har gått ut.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Tillbaka till inloggning
        </button>
      </div>
    </div>
  );
}

if (success) {
  // Success state after password reset
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lösenord ändrat!</h2>
        <p className="text-gray-600 mb-4">
          Ditt lösenord har återställts. Du kan nu logga in med ditt nya lösenord.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Gå till inloggning
        </button>
      </div>
    </div>
  );
}

// Main password reset form
return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Skapa nytt lösenord</h2>
      
      {/* Error message display */}
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* Password reset form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password input with validation */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            Nytt lösenord
          </label>
          <input
            id="newPassword"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            value={newPassword}
            onChange={(e) => handlePasswordChange(e.target.value)}
          />
          {/* Password requirements checklist */}
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">Lösenordet måste innehålla:</p>
            <ul className="text-sm space-y-1">
              <li className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.length ? '✓' : '○'} Minst 6 tecken
              </li>
              <li className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.uppercase ? '✓' : '○'} Minst en stor bokstav (A-Z)
              </li>
              <li className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.lowercase ? '✓' : '○'} Minst en liten bokstav (a-z)
              </li>
              <li className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordValidation.number ? '✓' : '○'} Minst en siffra (0-9)
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Bekräfta nytt lösenord
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Arbetar...' : 'Återställ lösenord'}
        </button>
      </form>
    </div>
  </div>
);
}