// Robot management component with form handling and list view
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, RobotFormData } from '../interface/index';
import { Trash2, Edit2, Info, Plus} from 'lucide-react';

// Form component for adding and editing robots
const RobotForm = ({ 
  robot, 
  onSubmit, 
  onCancel 
}: { 
  robot?: Robot;
  onSubmit: (formData: RobotFormData) => Promise<void>;
  onCancel: () => void;
}) => {
  // Form state management
  const [formData, setFormData] = useState<RobotFormData>({
    name: robot?.name || '',
    description: robot?.description || '',
    isAvailable: robot?.isAvailable ?? true,
  });

  // Update form data when robot prop changes
  useEffect(() => {
    if (robot) {
      setFormData({
        name: robot.name,
        description: robot.description,
        isAvailable: robot.isAvailable
      });
    }
  }, [robot]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Render form component
  return (
    <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 mb-4">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
        {robot ? 'Redigera Robot' : 'Lägg till Robot'}
      </h2>
      <div className="space-y-4">
        {/* Name input field */}
        <div>
          <label className="block mb-1 text-gray-700">Namn:</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
            required
          />
        </div>

        {/* Description input field */}
        <div>
          <label className="block mb-1 text-gray-700">Beskrivning:</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
            rows={3}
          />
        </div>

        {/* Availability toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={e => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
            className="mr-2 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
          />
          <label className="text-gray-700">Tillgänglig</label>
        </div>

        {/* Form action buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
          >
            {robot ? 'Uppdatera' : 'Lägg till'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    </form>
  );
};

// Main robot list and management view
export default function RobotView() {
  // State management
  const [robots, setRobots] = useState<Robot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [robotToDelete, setRobotToDelete] = useState<Robot | null>(null);
  const navigate = useNavigate();

  // Fetch robots and check admin status on component mount
  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const response = await axios.get('/api/robot');
        setRobots(response.data);
        
        // Check admin status
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

  // Handle form submission for both add and edit
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

  // Handle robot deletion
  const handleDelete = async (robot: Robot) => {
    try {
      await axios.delete(`/api/robot/${robot.id}`);
      setRobots(robots.filter(r => r.id !== robot.id));
      setShowDeleteModal(false);
      setRobotToDelete(null);
    } catch (err: any) {
      setError(err.response?.data || 'Kunde inte ta bort robot');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  Robotar
                </h1>
                <p className="text-gray-600">
                  Klicka på "Mer Information" för att läsa mer om respektive robot
                </p>
              </div>
              {/* Add robot button - admin only */}
              {isAdmin && !showAddForm && !editingRobot && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2"/>
                  Lägg till Robot
                </button>
              )}
            </div>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mb-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}

          {/* Robot form for add/edit */}
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

          {/* Robot list section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
            {robots.length > 0 ? (
              <div className="grid gap-4">
                {robots.map((robot) => (
                  <div
                    key={robot.id}
                    className="bg-white/80 backdrop-blur-sm rounded-lg border border-violet-200 hover:border-violet-300 p-4 flex justify-between items-center transition-all duration-200"
                  >
                    {/* Robot info */}
                    <div className="flex-grow">
                      <p className="font-medium text-lg text-gray-900">{robot.name}</p>
                      {robot.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {robot.description}
                        </p>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setEditingRobot(robot)}
                            className="px-4 py-2 flex items-center border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 mr-2"/>
                            Redigera
                          </button>
                          <button
                            onClick={() => {
                              setRobotToDelete(robot);
                              setShowDeleteModal(true);
                            }}
                            className="px-4 py-2 flex items-center bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2"/>
                            Ta bort
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/robots/${robot.id}`)}
                        className="px-4 py-2 flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                      >
                        <Info className="w-4 h-4 mr-2"/>
                        Mer Information
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p className="text-gray-500">Inga robotar att visa.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && robotToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Bekräfta borttagning</h2>
            <div className="space-y-2 py-4">
              <p>Är du säker på att du vill ta bort denna robot?</p>
              <p className="font-medium">{robotToDelete.name}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRobotToDelete(null);
                }}
              >
                Avbryt
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600"
                onClick={() => handleDelete(robotToDelete)}
              >
                Bekräfta borttagning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}