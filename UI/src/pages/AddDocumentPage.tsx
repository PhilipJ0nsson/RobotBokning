// Component for adding and uploading documents to a robot's profile
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { DocumentForm, DocumentType } from '../interface/index';

export default function AddDocument() {
  // Get robot ID from URL parameters and initialize navigation
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management for form handling
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DocumentForm>({
    title: '',
    description: '',
    type: 'pdf',
    file: null
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // Handle form submission and file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Du måste välja en fil');
      return;
    }

    try {
      setLoading(true);
      // Create FormData object for multipart/form-data submission
      const fileData = new FormData();
      fileData.append('title', formData.title);
      fileData.append('description', formData.description);
      fileData.append('type', formData.type);
      fileData.append('file', formData.file);

      // Send POST request to upload document
      await axios.post(`/api/document/robot/${id}`, fileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/robots/${id}`);
    } catch (err: any) {
      setError(err.response?.data || 'Kunde inte ladda upp dokumentet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-3xl mx-auto">
          {/* Main form container with glassmorphism effect */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
            {/* Header section with title and back button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                Lägg till Dokument
              </h1>
              <button
                onClick={() => navigate(`/robots/${id}`)}
                className="text-violet-600 hover:text-violet-800 transition-colors"
              >
                ← Tillbaka
              </button>
            </div>

            {/* Error message display */}
            {error && (
              <div className="mb-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Document upload form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title input field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titel
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>

              {/* Description textarea */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>

              {/* Document type selector */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Dokumenttyp
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="image">Bild</option>
                  <option value="text">Text</option>
                </select>
              </div>

              {/* File upload input with dynamic accept attribute based on selected type */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  Fil
                </label>
                <input
                  type="file"
                  id="file"
                  required
                  onChange={handleFileChange}
                  accept={
                    formData.type === 'pdf' ? '.pdf' :
                    formData.type === 'image' ? '.jpg,.jpeg,.png' :
                    formData.type === 'text' ? '.txt,.doc,.docx' :
                    undefined
                  }
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-violet-500 file:to-indigo-500 file:text-white
                    hover:file:from-violet-600 hover:file:to-indigo-600
                    file:transition-all"
                />
              </div>

              {/* Form action buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/robots/${id}`)}
                  className="px-4 py-2 text-violet-600 hover:text-violet-800 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Laddar upp...' : 'Ladda upp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}