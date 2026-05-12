import { Link } from 'react-router-dom';

function About() {
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

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">About E-Rank</h1>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Our Vision</h2>
          <p className="text-gray-600">To digitize and modernize taxi rank operations across South Africa, creating a seamless experience for drivers, passengers, owners and marshals.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Our Mission</h2>
          <p className="text-gray-600">To provide a reliable, real-time taxi queue management platform that improves efficiency at taxi ranks, reduces waiting times, and brings transparency to the taxi industry.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Our Team</h2>
          <p className="text-gray-600">E-Rank is developed and maintained by PMP Solutions, a technology company founded in 2024 and based in Kimberley, Northern Cape, South Africa.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Contact Us</h2>
          <p className="text-gray-600">Email: info@pmpsolutions.co.za</p>
          <p className="text-gray-600">Location: Kimberley, Northern Cape, South Africa</p>
          <p className="text-gray-600">Founded: 2024</p>
        </div>
      </div>

      <footer className="bg-gray-800 text-white text-center py-6 mt-16">
        <p className="text-gray-400">© 2024 E-Rank System. Property of PMP Solutions founded in 2024.</p>
      </footer>

    </div>
  );
}

export default About;