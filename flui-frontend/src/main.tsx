import { createRoot } from 'react-dom/client';
import { EditorProvider } from './contexts/EditorContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <EditorProvider>
    <App />
  </EditorProvider>
);
