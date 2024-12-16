import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios, { API_URL } from '../lib/axios'; 
import { Robot } from '../interface/index';
import { useAuth } from '../context/AuthContext'; // Lägg till denna import

export default function RobotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              Laddar...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : robot ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {robot.name}
                  </h1>
                  <button
                    onClick={() => navigate('/robots')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Tillbaka
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{robot.description}</p>
              </div>
  
              {/* Dokument sektion */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Dokument</h2>
                  {user?.isAdmin && (
                    <button
                      onClick={() => navigate(`/robots/${id}/add-document`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Lägg till Dokument
                    </button>
                  )}
                </div>
                {robot.documents && robot.documents.length > 0 ? (
                  <div className="grid gap-4">
                    {robot.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{doc.title}</h3>
                          {user?.isAdmin && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Är du säker på att du vill ta bort detta dokument?')) {
                                  try {
                                    await axios.delete(`/api/robot/${id}/document/${doc.id}`);
                                    setRobot(prev => prev ? {
                                      ...prev,
                                      documents: prev.documents.filter(d => d.id !== doc.id)
                                    } : null);
                                  } catch (err) {
                                    setError('Kunde inte ta bort dokumentet');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Ta bort
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
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Öppna dokument →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Inga dokument tillgängliga.</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Robot hittades inte.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}