import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-center gap-8">
          <Link to="/" className="text-gray-700 font-semibold hover:text-blue-600">Home</Link>
          <Link to="/about" className="text-gray-700 font-semibold hover:text-blue-600">About</Link>
          <Link to="/login" className="text-gray-700 font-semibold hover:text-blue-600">Sign In</Link>
          <Link to="/register" className="text-gray-700 font-semibold hover:text-blue-600">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-blue-700 text-white py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">E-Rank</h1>
        <p className="text-xl mb-8">Digital Taxi Queue Management System</p>
        <div className="flex justify-center gap-4">
          <Link to="/register"
            className="bg-white text-blue-700 px-8 py-3 rounded-full font-bold hover:bg-blue-50">
            Get Started
          </Link>
          <Link to="/login"
            className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600">
            Sign In
          </Link>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-5xl mb-4">🚕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Taxi Queue Management</h3>
            <p className="text-gray-600">Real-time digital queue system for taxi ranks. Drivers join queues by scanning QR codes.</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Passenger Management</h3>
            <p className="text-gray-600">Efficient passenger loading system with long distance trip recording and seat allocation.</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Taxi Tracking Services</h3>
            <p className="text-gray-600">Live queue status updates showing available taxis and estimated waiting times at ranks.</p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-16">
        <p className="text-gray-400">© 2024 E-Rank System. Property of PMP Solutions founded in 2024.</p>
      </footer>

    </div>
  );
}

export default Home;