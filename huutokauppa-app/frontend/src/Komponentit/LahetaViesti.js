import React, { useState, useEffect } from 'react';
import axios from "axios"
import { useAuth } from './kayttajacontext';
import { Link } from 'react-router-dom';

const style = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
  },
  th: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '8px',
  },
  td: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '8px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    padding: '8px',
    cursor: 'pointer',
  },
  selectedButton: {
    backgroundColor: '#333',
    color: '#fff',
  },
};

const LahetaViesti = ({ myyjanNimi, tuotteenNimi }) => {
  const { user } = useAuth();
  const [kayttaja, setkayttaja] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredKayttajat, setFilteredKayttajat] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/kayttajat');
        console.log('Response:', response.data);
        setkayttaja(response.data);
        setFilteredKayttajat(response.data);
      } catch (error) {
        console.error('Virhe kayttajien haussa:', error);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const filteredUsers = kayttaja.filter(kayttaja => kayttaja.nimi.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredKayttajat(filteredUsers);
  }, [searchTerm, kayttaja]);

  const handlekayttaja = (selectedKayttaja) => {
    console.log(selectedKayttaja, "usersasda");
    setSelectedUser(selectedKayttaja);
    setParticipants({ user1: user.objectId, user2: selectedKayttaja._id });
    console.log(participants);
  }

  async function createConversation() {
    try {
      const response = await axios.post('/api/conversations', { participants });
      console.log('New conversation created:', response.data);
      window.location.reload(); // Refresh the page
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error.response.data.error);
      throw error;
    }
  }

  return (
    <div className="laheta-viesti">
      <h2>Käyttäjähaku</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Etsi käyttäjää nimellä..."
        style={{ marginBottom: '10px', padding: '5px' }}
      />
      <table style={style.table}>
        <thead>
          <tr>
            <th style={style.th}>ID</th>
            <th style={style.th}>Nimi</th>
            <th style={style.th}>Puhelinnumero</th>
            <th style={style.th}>Sähköposti</th>
            <th style={style.th}>Toiminnot</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredKayttajat) && filteredKayttajat.length > 0 ? (
            filteredKayttajat.map((kayttaja) => (
              <tr key={kayttaja.id}>
                <td style={style.td} title={kayttaja._id}>{kayttaja._id.slice(-6)}</td>
                
                <td style={style.td}><Link to={`/users/${kayttaja.nimi}`}>{kayttaja.nimi} </Link></td>
               
                <td style={style.td}>{kayttaja.puhnum}</td>
                <td style={style.td}>{kayttaja.sposti}</td>
                <td style={style.td}>
                  <div style={style.buttonContainer}>
                    <button
                      style={{ ...style.button, ...(selectedUser === kayttaja && style.selectedButton) }}
                      onClick={() => handlekayttaja(kayttaja)}
                    >
                      Valitse
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={style.td} colSpan="6">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={() => createConversation()}>luo keskustelu</button>
    </div>
  );
};

export default LahetaViesti;
