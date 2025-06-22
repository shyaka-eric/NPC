import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
    <div className="w-full max-w-2xl mb-6 flex justify-start">
      <Link to="/" className="text-blue-700 font-semibold hover:underline">← Home</Link>
    </div>
    <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">About NPC Logistics</h1>
      <p className="text-lg text-slate-700 mb-4">
        NPC Logistics is a trusted platform designed to streamline, manage, and optimize inventory and supply chains within national operations. Our mission is to provide real-time tracking, smart analytics, and secure, enterprise-grade solutions for logistics management.
      </p>
      <ul className="list-disc pl-6 text-slate-700 mb-4">
        <li>Real-time tracking of shipments and inventory</li>
        <li>Advanced analytics for data-driven decisions</li>
        <li>Secure platform for sensitive operations</li>
        <li>24/7 support for uninterrupted service</li>
      </ul>
      <p className="text-slate-600">
        This project is built with modern web technologies and a robust backend, ensuring reliability, scalability, and ease of use for all users involved in logistics and supply chain management.
      </p>
    </div>
  </div>
);

export default AboutPage;
