import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullNames: '',
    cellphone: '',
    password: '',
    role: 'passenger',
    adminCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.register(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('fullNames', response.data.fullNames);
      const role = response.data.role;
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'owner') navigate('/dashboard/owner');
      else if (role === 'driver') navigate('/dashboard/driver');
      else if (role === 'marshal') navigate('/dashboard/marshal');
      else navigate('/dashboard/passenger');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-center gap-8">
          <Link to="/" className="text-gray-700 font-semibold hover:text-blue-600">Home</Link>
          <Link to="/about" className="text-gray-700 font-semibold hover:text-blue-600">About</Link>
          <Link to="/login" className="text-gray-700 font-semibold hover:text-blue-600">Sign In</Link>
          <Link to="/register" className="text-gray-700 font-semibold hover:text-blue-600">Sign Up</Link>
        </div>
      </nav>

      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Create Account</h2>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Full Names</label>
              <input
                type="text"
                name="fullNames"
                value={formData.fullNames}
                onChange={handleChange}
                placeholder="Enter your full names"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Cellphone Number</label>
              <input
                type="text"
                name="cellphone"
                value={formData.cellphone}
                onChange={handleChange}
                placeholder="Enter your cellphone number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Select Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
                <option value="marshal">Marshal</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'admin' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Admin Secret Code</label>
                <input
                  type="password"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  placeholder="Enter 4-digit admin code"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>

      <footer className="bg-gray-800 text-white text-center py-6">
        <p className="text-gray-400">© 2024 E-Rank System. Property of PMP Solutions founded in 2024.</p>
      </footer>
    </div>
  );
}

export default Register;