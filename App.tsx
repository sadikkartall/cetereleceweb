import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { schedulerService } from './src/services/schedulerService';
import AppRoutes from './src/routes';

const App = () => {
  React.useEffect(() => {
    // Zamanlayıcı servislerini başlat
    schedulerService.scheduleWeeklyAgentCreation();
    schedulerService.scheduleBlogPostCreation();
    schedulerService.scheduleInteractions();
  }, []);

  return (
    <div data-testid="app-container">
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </div>
  );
};

export default App; 
} 