import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { DocumentForm, DocumentType } from '../interface/index';

export default function AddDocument() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DocumentForm>({
    title: '',
    description: '',
    type: 'pdf',
    file: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Du måste välja en fil');
      return;
    }

    try {
      setLoading(true);
      const fileData = new FormData();
      fileData.append('title', formData.title);
      fileData.append('description', formData.description);
      fileData.append('type', formData.type);
      fileData.append('file', formData.file);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Lägg till Dokument
              </h1>
              <button
                onClick={() => navigate(`/robots/${id}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Tillbaka
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Dokumenttyp
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="image">Bild</option>
                  <option value="text">Text</option>
                </select>
              </div>

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
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/robots/${id}`)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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