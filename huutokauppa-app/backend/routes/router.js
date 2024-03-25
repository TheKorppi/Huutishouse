const express = require('express')
const router = express.Router()
const schemat = require('../models/schemas')
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Specify the directory where you want to save the files

const io = require('socket.io')();


// //-> post ( /uusikayttaja )
// router.post('/uusikayttaja'), async(req, res) => {
// const {nimi,puhelinnro,sposti,kayttajatuunnus,adminoikeudet} = req.body
// const kayttajatData = {nimi:nimi,puhelinnro:puhelinnro,sposti:sposti,kayttajatuunnus:kayttajatuunnus,adminoikeudet:adminoikeudet}

// const uusikayttaja = new schemat.Kayttajat(kayttajatData)
// const tallennaKayttaja = await uusikayttaja.save()
// if(tallennaKayttaja){
//   res.send('vastaanotto onnistui')
// }
// res.end()
// }

//ottaa vastaan myynti sivun sumbitit, ja lähettää databaseen
router.post('/myynti', upload.single('kuva'), async (req, res) => {
  const { kayttajaid, nimi, lahtohinta, endingTime, hintavaraus } = req.body;

  try {
    const kuvaPath = req.file.path;

    const newTuote = new schemat.Tuote({
      kayttajaid,
      nimi,
      lahtohinta,
      hintavaraus,
      endingTime,
      kuva: kuvaPath,
      huudot: {
        type: Array,
        default: [] // This ensures an empty array by default
      }
    });

    await newTuote.save();
    res.send('vastaanotto onnistui');
  } catch (error) {
    console.error('virhe', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/palauteviesti', async (req, res) => {
  const { nimi, viesti } = req.body;
  try {
    const palaute = schemat.Palaute({
      nimi,
      viesti
    })
    await palaute.save();
    res.status(200).json({ message: 'Form submission successful' });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/palauteviesti', async (req, res) => {
  try {
    const palautteet = schemat.Palaute;
    const palaute = await palautteet.find();
    res.json(palaute);
    
  } catch (error) {
    console.error('Error fetching feedback messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tuottet/:kategoria', async (req, res) => {
  try {
    const kategoriat = schemat.Kategoria;
    const valittukategoria = req.params.kategoria;
    const kategoria = await kategoriat.findOne({ kategoria:valittukategoria});
    if (!kategoria) {
      return res.status(404).json({ error: 'kategoria not found' });
    }
    res.json(kategoria);
  } catch (error) {
    console.error('Error fetching kategoria data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});

router.get('/uploads/:kuva', (req, res) => {
  const kuva = req.params.kuva;
  const filePath = path.join(__dirname, '../uploads', kuva);
  res.sendFile(filePath);
});

router.get('/tuotteet', async (req, res) => {
  try {
    const tuotteet = schemat.Tuote
    const products = await tuotteet.find();
    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tuotteet/:_id', async (req, res) => {
  try {
    const tuotteet = schemat.Tuote;
    const tuoteId = req.params._id;
    const product = await tuotteet.findOne({ _id:tuoteId});
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }  
});

router.put('/tuotteet/:_id', async (req, res) => {
  const productId = req.params._id;
  const updatedProductData = req.body;
  try {
    const product = await schemat.Tuote.findOneAndUpdate(
      { _id:productId },
      updatedProductData,
      { new: true }
    );

    if (!product) {
      return res.status(404).send('Product not found');
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/tuotteet/:_id/huudot', async (req, res) => {
  const productId = req.params._id;
  const huuto = req.body
  try{
    const product = await schemat.Tuote.findOne({ _id : productId})
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }

    // Tarkista, onko huutokauppa päättynyt
    if (new Date() > new Date(product.endingTime)) {
      return res.status(400).json({ error: 'Huutokauppa on jo päättynyt' });
    }    

    // Construct the new message object
    const newhuuto = {
      kayttajaid: huuto.kayttajaid,
      huuto: huuto.huuto,
      
    };

    // Update the messages array in the conversation document
    product.huudot.push(newhuuto);

    // Save the updated conversation document back to the database
    await product.save();

    res.status(200).json({ message: 'huuto added to conversation' });
  } catch (error) {
    console.error('Error adding huuto to tuote:', error);
    res.status(500).json({ error:  error.message });
  }
  

});
router.get('/kategoriat', async (req, res) => {
  try {
    const kategoriat = schemat.Kategoria
    const Kategoria = await kategoriat.find();
    res.json(Kategoria);
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/kayttajat', async (req, res) => {
  try {
    const kayttajat = schemat.Kayttaja
    const Kayttaja = await kayttajat.find();
    res.json(Kayttaja);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/users/:_id', async (req, res) => {
  try {
    const kayttjat = schemat.Kayttaja;
    const userId = req.params._id;
    const user = await kayttjat.findOne({_id:userId});
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  const id = (req.params.id);
  const updatedUserData = req.body;
  try {
    const user = await schemat.Kayttaja.findByIdAndUpdate(
      { id }, // Find user by id
      updatedUserData, // Updated user data
      { new: true } // Return the modified user
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user); // Send updated user data as response
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/api/register', async (req, res) => {
  try {
    const { nimi, salasana, sposti, puhnum } = req.body;
    
    // Tarkista, onko sähköpostiosoite jo käytössä
    const existingUser = await schemat.Kayttaja.findOne({ sposti });
    if (existingUser) {
      return res.status(400).send('Sähköpostiosoite on jo rekisteröity.');
    }
    
    // Luo uusi käyttäjä
    const hashedPassword = await bcrypt.hash(salasana, 10);
    const newUser = new schemat.Kayttaja({ nimi, salasana: hashedPassword, sposti, puhnum });
    await newUser.save();

    res.status(201).send('Käyttäjä rekisteröityi onnistuneesti.');
  } catch (error) {
    console.error('Virhe rekisteröidessä käyttäjää:', error);
    res.status(500).send('Rekisteröinti epäonnistui.');
  }
});


router.post('/api/login', async (req, res) => {
  try {
    const { nimi, salasana } = req.body;
    const kayttajat = schemat.Kayttaja;
    
    // Find the user by username
    const user = await kayttajat.findOne({ nimi });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Compare passwords using a hashing library like bcrypt
    const passwordsMatch = await bcrypt.compare(salasana, user.salasana);
    if (passwordsMatch) {
      // If passwords match, send a success response
      res.status(200).json({ objectId: user._id,nimi: user.nimi, message: 'Login successful' });
    } else {
      // If passwords don't match, send an unauthorized response
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    // Handle any errors
    res.status(500).send('Error logging in: ' + error.message);
  }
});
router.post('/api/conversations', async (req, res) => {
  const { participants } = req.body;

  try {
   

    // Create a new conversation document
    const Conversation = schemat.Keskustelu
    const newConversation = new Conversation({
      participants,
      messages:[] // This ensures an empty array by default
      
    });

    // Save the new conversation document to the database
    const savedConversation = await newConversation.save();

    res.status(201).json(savedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/api/conversations/:conversationId/messages', async (req, res) => {

  const { conversationId } = req.params;
  const { senderId, messageText } = req.body;

  try {
    /*
    Koodi Frontendissä uudelle viestille keskustelun sisällä
    async function addMessageToConversation(conversationId, senderId, messageText) {
  try {
    const response = await axios.post(`/api/conversations/${conversationId}/messages`, {
      senderId,
      messageText
    });
    console.log(response.data.message);
  } catch (error) {
    console.error('Error adding message to conversation:', error.response.data.error);
  }
}

    */ 
    const Conversation = schemat.Keskustelu
    // Retrieve the conversation document from the database
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Construct the new message object
    const newMessage = {
      sender: senderId,
      text: messageText,
      timestamp: new Date()
    };

    // Update the messages array in the conversation document
    conversation.messages.push(newMessage);

    // Save the updated conversation document back to the database
    await conversation.save();

    res.status(200).json({ message: 'Message added to conversation' });
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/api/user/:userId/conversations', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all conversations where the user's ID appears in the participants array
    const conversations = await Conversation.find({ participants: userId });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error finding conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//haku function
router.get(' ', (req, res) => {
    const userData = 
    [
        {
          "id": 1,
          "name": "Leanne Graham",
          "username": "Bret",
          "email": "Sincere@april.biz",
          "address": {
            "street": "Kulas Light",
            "suite": "Apt. 556",
            "city": "Gwenborough",
            "zipcode": "92998-3874",
            "geo": {
              "lat": "-37.3159",
              "lng": "81.1496"
            }
          },
          "phone": "1-770-736-8031 x56442",
          "website": "hildegard.org",
          "company": {
            "name": "Romaguera-Crona",
            "catchPhrase": "Multi-layered client-server neural-net",
            "bs": "harness real-time e-markets"
          }
        },
        {
          "id": 2,
          "name": "Ervin Howell",
          "username": "Antonette",
          "email": "Shanna@melissa.tv",
          "address": {
            "street": "Victor Plains",
            "suite": "Suite 879",
            "city": "Wisokyburgh",
            "zipcode": "90566-7771",
            "geo": {
              "lat": "-43.9509",
              "lng": "-34.4618"
            }
          },
          "phone": "010-692-6593 x09125",
          "website": "anastasia.net",
          "company": {
            "name": "Deckow-Crist",
            "catchPhrase": "Proactive didactic contingency",
            "bs": "synergize scalable supply-chains"
          }
        },
        {
          "id": 3,
          "name": "Clementine Bauch",
          "username": "Samantha",
          "email": "Nathan@yesenia.net",
          "address": {
            "street": "Douglas Extension",
            "suite": "Suite 847",
            "city": "McKenziehaven",
            "zipcode": "59590-4157",
            "geo": {
              "lat": "-68.6102",
              "lng": "-47.0653"
            }
          },
          "phone": "1-463-123-4447",
          "website": "ramiro.info",
          "company": {
            "name": "Romaguera-Jacobson",
            "catchPhrase": "Face to face bifurcated interface",
            "bs": "e-enable strategic applications"
          }
        }
    ]

    res.send(userData)
})






module.exports = router