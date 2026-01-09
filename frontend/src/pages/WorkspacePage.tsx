import React from 'react';
import Header from '../components/common/Header';
import PerlerGenerator from '../components/perler/PerlerGenerator';

const WorkspacePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PerlerGenerator />
    </div>
  );
};

export default WorkspacePage;
