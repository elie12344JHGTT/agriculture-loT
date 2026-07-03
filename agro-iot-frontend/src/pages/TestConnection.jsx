// src/components/TestConnection.jsx
import { useEffect } from 'react';
import axios from '../api/axios'; 

function TestConnection() {
  useEffect(() => {
    // Test de la connexion
    axios.get('/api/test-connection')
      .then(response => {
        console.log("Réponse du serveur :", response.data.message);
        alert("Succès : " + response.data.message);
      })
      .catch(error => {
        console.error("Erreur de connexion :", error);
        alert("Erreur : Impossible de contacter le serveur.");
      });
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>Test de communication</h2>
      <p>Vérification en cours dans la console...</p>
    </div>
  );
}


// ... votre code existant ...

export default TestConnection;
