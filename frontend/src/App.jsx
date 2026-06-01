import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AmazonPreviewPage from './pages/AmazonPreviewPage';
import EtsyPreviewPage from './pages/EtsyPreviewPage';
import AmazonSearchPage from './pages/AmazonSearchPage';
import ControlPanel from './components/shared/ControlPanel';

const Landing = () => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
    <h1 className="text-3xl font-bold mb-8 text-gray-900">Happy Creative Preview Product</h1>
    <div className="flex space-x-6">
      <Link to="/amazon" className="px-6 py-3 bg-amazon-yellow text-black font-bold rounded shadow hover:bg-yellow-500">
        Amazon Preview
      </Link>
      <Link to="/search" className="px-6 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
        Amazon Search Simulator
      </Link>
      <Link to="/etsy" className="px-6 py-3 bg-orange-500 text-white font-bold rounded shadow hover:bg-orange-600">
        Etsy Preview
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/amazon" element={<AmazonPreviewPage />} />
        <Route path="/search" element={<AmazonSearchPage />} />
        <Route path="/etsy" element={<EtsyPreviewPage />} />
      </Routes>
      <ControlPanel />
    </Router>
  );
}

export default App;
