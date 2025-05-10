
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runMigrations } from './lib/migrations';

// Check if migrations have already been run in this browser session
const MIGRATIONS_VERSION = 'v1.0.0'; // Change this when migrations need to be run again
const migrationsCompleted = localStorage.getItem('migrationsCompleted') === MIGRATIONS_VERSION;

// Only run migrations if they haven't been run yet
const initApp = () => {
  // Always render the app, regardless of migrations
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

if (migrationsCompleted) {
  console.log('Skipping migrations - already completed');
  initApp();
} else {
  // Run migrations once
  runMigrations()
    .then((result) => {
      if (result && result.success) {
        console.log('Database setup complete');
        // Mark migrations as completed
        localStorage.setItem('migrationsCompleted', MIGRATIONS_VERSION);
      } else {
        console.warn('Some migration steps failed, but application will continue');
      }
    })
    .catch(error => {
      console.error('Error setting up database:', error);
      console.warn('Continuing application startup despite migration errors');
    })
    .finally(() => {
      initApp();
    });
}
