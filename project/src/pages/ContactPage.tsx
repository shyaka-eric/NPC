import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const ContactPage: React.FC = () => {
  const [email, setEmail] = useState('admin@npc-logistics.com');
  const [phone, setPhone] = useState('+1 (234) 567-890');

  useEffect(() => {
    // Fetch system admin contact info from backend settings endpoint
    api.get('settings/')
      .then(res => {
        if (res.data && res.data.length > 0) {
          const settings = res.data[0];
          if (settings.admin_email) setEmail(settings.admin_email);
          if (settings.admin_phone) setPhone(settings.admin_phone);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg mb-6 flex justify-start">
        <Link to="/" className="text-blue-700 font-semibold hover:underline">← Home</Link>
      </div>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Contact System Admin</h1>
        <p className="text-lg text-slate-700 mb-6">
          For support, questions, or to reach the system administrator, please use the contact details below:
        </p>
        <div className="mb-4">
          <span className="font-semibold text-slate-800">Email:</span>
          <a href={`mailto:${email}`} className="text-blue-600 ml-2 hover:underline">{email}</a>
        </div>
        <div>
          <span className="font-semibold text-slate-800">Phone:</span>
          <a href={`tel:${phone}`} className="text-blue-600 ml-2 hover:underline">{phone}</a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
