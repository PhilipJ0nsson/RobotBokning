import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, RobotFormData } from '../interface/index';


// RobotForm definierad UTANFÖR RobotView
const RobotForm = ({ robot, onSubmit, onCancel }: { 
  robot?: Robot;
  onSubmit: (formData: RobotFormData) => Promise<void>;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<RobotFormData>({
    name: robot?.name || '',
    description: robot?.description || '',
    isAvailable: robot?.isAvailable ?? true,  // Använd ?? istället för ||
  });

  // Lägg till denna useEffect
  useEffect(() => {
    if (robot) {
      setFormData({
        name: robot.name,
        description: robot.description,
        isAvailable: robot.isAvailable
      });
    }
  }, [robot]);
    // Uppdatera handleSubmit för att använda onSubmit prop
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await onSubmit(formData);
    };
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <h2 className="text-xl font-bold mb-4">
        {robot ? 'Redigera Robot' : 'Lägg till Robot'}
      </h2>
      <div className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Namn:</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Beskrivning:</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={e => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="mr-2"
            />
            <label>Tillgänglig</label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {robot ? 'Uppdatera' : 'Lägg till'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Avbryt
          </button>
        </div>
      </div>
    </form>
  );
};

// Huvudkomponenten RobotView
export default function RobotView() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const response = await axios.get('/api/robot');
        setRobots(response.data);
        
        try {
          await axios.get('/api/admin/users');
          setIsAdmin(true);
        } catch {
          setIsAdmin(false);
        }
      } catch (err: any) {
        setError(err.response?.data || 'Kunde inte hämta robotar');
      }
    };

    fetchRobots();
  }, []);

  const handleFormSubmit = async (formData: RobotFormData) => {
    try {
      if (editingRobot) {
        const response = await axios.put(`/api/robot/${editingRobot.id}`, formData);
        setRobots(robots.map(robot => 
          robot.id === editingRobot.id ? response.data : robot
        ));
        setEditingRobot(null);
      } else {
        const response = await axios.post('/api/robot', formData);
        setRobots([...robots, response.data]);
        setShowAddForm(false);
      }
    } catch (err: any) {
      setError(err.response?.data || 'Kunde inte spara robot');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna robot?')) return;
    try {
      await axios.delete(`/api/robot/${id}`);
      setRobots(robots.filter(robot => robot.id !== id));
    } catch (err: any) {
      setError(err.response?.data || 'Kunde inte ta bort robot');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Robotar</h1>
                <p className="text-gray-600">
                  Klicka på "Mer Information" för att läsa mer om respektive robot
                </p>
              </div>
              {isAdmin && !showAddForm && !editingRobot && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Lägg till Robot
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {(showAddForm || editingRobot) && (
            <RobotForm
              robot={editingRobot || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowAddForm(false);
                setEditingRobot(null);
              }}
            />
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            {robots.length > 0 ? (
              <div className="grid gap-4">
                {robots.map((robot) => (
                  <div
                    key={robot.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex-grow">
                      <p className="font-medium text-lg">{robot.name}</p>
                      {robot.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {robot.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingRobot(robot);
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => handleDelete(robot.id)}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                          >
                            Ta bort
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/robots/${robot.id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Mer Information
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Inga robotar att visa.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}