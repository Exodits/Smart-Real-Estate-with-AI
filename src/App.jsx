import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import PropertyDetails from './pages/PropertyDetails';
import Market from './pages/Market';
import Compare from './pages/Compare';
import AIAdvisor from './pages/AIAdvisor';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

import ListProperty from './pages/ListProperty';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/properties" element={<Search />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/list-property" element={<ListProperty />} />
          <Route path="/market" element={<Market />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
