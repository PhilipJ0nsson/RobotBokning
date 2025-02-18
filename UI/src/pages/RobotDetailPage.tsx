// Robot detail page component displaying information and documents
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios, { API_URL } from '../lib/axios'; 
import { Robot } from '../interface/index';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, ArrowLeft } from 'lucide-react';

export default function RobotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: number, title: string} | null>(null);

  // Fetch robot data when component mounts
  useEffect(() => {
    const fetchRobotDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/robot/${id}`);
        setRobot(response.data);
      } catch (err: any) {
        setError(err.response?.data || 'Kunde inte hämta robotinformation');
      } finally {
        setLoading(false);
      }
    };

    fetchRobotDetails();
  }, [id]);

  // Handle document deletion
  const handleDeleteDocument = async (documentId: number) => {
    try {
      await axios.delete(`/api/Document/${documentId}`);
      setRobot(prev => prev ? {
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId)
      } : null);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (err) {
      setError('Kunde inte ta bort dokumentet');
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
              Laddar...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="mb-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : robot ? (
            <>
              {/* Robot information card */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                    {robot.name}
                  </h1>
                  <button
                    onClick={() => navigate('/robots')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{robot.description}</p>
              </div>
  
              {/* Documents section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-violet-600" />
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                      Dokument
                    </h2>
                  </div>
                  {user?.isAdmin && (
                    <button
                      onClick={() => navigate(`/robots/${id}/add-document`)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Lägg till Dokument
                    </button>
                  )}
                </div>
                {robot.documents && robot.documents.length > 0 ? (
                  <div className="grid gap-4">
                    {robot.documents.map((doc) => (
                      <div key={doc.id} className="bg-white/80 backdrop-blur-sm rounded-lg border border-violet-200 hover:border-violet-300 p-4 transition-all duration-200">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          {user?.isAdmin && (
                            <button
                              onClick={() => {
                                setDocumentToDelete({ id: doc.id, title: doc.title });
                                setShowDeleteModal(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                  />
                                </svg>
                                Ta bort
                              </div>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Uppladdad: {new Date(doc.uploadDate).toLocaleDateString('sv-SE')}
                          </span>
                          <a 
                            href={`${API_URL}${doc.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                          >
                            Öppna dokument
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Inga dokument tillgängliga.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
              <p className="text-gray-600">Robot hittades inte.</p>
            </div>
          )}
        </div>
      </div>
      {/* Delete document confirmation modal */}
      {showDeleteModal && documentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
              Bekräfta borttagning
            </h2>
            <div className="space-y-2 py-4">
              <p className="text-gray-700">Är du säker på att du vill ta bort detta dokument?</p>
              <p className="font-medium text-gray-900">
                {documentToDelete.title}
              </p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDocumentToDelete(null);
                }}
              >
                Avbryt
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600"
                onClick={() => handleDeleteDocument(documentToDelete.id)}
              >
                Ta bort dokument
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}