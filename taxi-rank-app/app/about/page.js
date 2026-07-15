import Navbar from "../../components/Navbar";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-slate-800 text-center mb-12">
          About E-Rank
        </h1>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
              To digitize and modernize taxi rank operations across South Africa, creating a seamless, safe, and efficient public transit ecosystem for drivers, passengers, owners, and marshals.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              To empower taxi marshals with accessible digital tools, eliminate rank waiting lines, track fleet revenues transparently, and elevate passenger safety standards.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">The Development Team</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              E-Rank is designed and developed by **PMP Solutions**, founded in 2024 in Kimberley, Northern Cape, South Africa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-6">
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="font-semibold block text-slate-700">Oarabetse Morata</span>
                <span className="text-slate-500">Student No: 202406427</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="font-semibold block text-slate-700">Phuti Setati</span>
                <span className="text-slate-500">Student No: 202435062</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="font-semibold block text-slate-700">Kholofelo Phalakatsela</span>
                <span className="text-slate-500">Student No: 202306829</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="font-semibold block text-slate-700">Louisa Mdluli</span>
                <span className="text-slate-500">Student No: 202324412</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3 col-span-1 sm:col-span-2">
                <span className="font-semibold block text-slate-700">Siyabonga José Ndzobondzobo</span>
                <span className="text-slate-500">Student No: 202441850</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Contact Information</h2>
            <p className="text-slate-600 leading-relaxed">
              Email: <span className="text-blue-600">info@pmpsolutions.co.za</span><br />
              Location: Kimberley, Northern Cape, South Africa
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 text-slate-400 text-center py-8">
        <p className="text-sm">© 2024 E-Rank System. Property of PMP Solutions.</p>
      </footer>
    </div>
  );
}
