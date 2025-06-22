import React from 'react';

const ContactPage: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
    <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">Contact System Admin</h1>
      <p className="text-lg text-slate-700 mb-6">
        For support, questions, or to reach the system administrator, please use the contact details below:
      </p>
      <div className="mb-4">
        <span className="font-semibold text-slate-800">Email:</span>
        <a href="mailto:admin@npc-logistics.com" className="text-blue-600 ml-2 hover:underline">admin@npc-logistics.com</a>
      </div>
      <div>
        <span className="font-semibold text-slate-800">Phone:</span>
        <a href="tel:+1234567890" className="text-blue-600 ml-2 hover:underline">+1 (234) 567-890</a>
      </div>
    </div>
  </div>
);

// No changes needed to the component itself, but ensure the file is correctly exported and imported in routes.
// If you are using hash routing, make sure your router is set up to handle /contact, /about, /features paths.
// If not, you may need to use <Navigate> or <Redirect> in your router setup for legacy hash URLs.

export default ContactPage;
