import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { schedulerService } from './services/schedulerService';
import AppRoutes from './routes';

function App() {
  useEffect(() => {
    // Zamanlayıcı servislerini başlat
    schedulerService.scheduleWeeklyAgentCreation();
    schedulerService.scheduleBlogPostCreation();
    schedulerService.scheduleInteractions();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App; 