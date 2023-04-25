/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Almacén de la conversación
const conversation = [];
// Añadir el mensaje del usuario a la conversación
//conversation.push({ role: 'system', content: 'Eres un asistente para una persona anciana. Su nombre es Maricarmen. Dirígete a ella así, y dile que te llamas Jose. La idea es que le puedas proponer juegos o actividades o conversacion para mantenerla entrentenida.' });
conversation.push({
  role: 'system',
  content:
    'Eres una inteligencia artificial llamada JARVIS. Has sido creada por Tony Stark y llamada así en memoria de su mayordomo.'
});
var app = {
  // Application Constructor
  initialize: function() {
    document.addEventListener(
      'deviceready',
      this.onDeviceReady.bind(this),
      false
    );
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function() {
    this.receivedEvent('deviceready');
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
    const listenButton = document.getElementById('listenButton');
    const status = document.getElementById('status');

    listenButton.addEventListener('click', listen);
    isRecognitionAvailable();
  }
};

function isRecognitionAvailable() {
  window.plugins.speechRecognition.isRecognitionAvailable(
    function(available) {
      if (!available) {
        console.log('Sorry, not available');
      }

      // Check if has permission to use the microphone
      window.plugins.speechRecognition.hasPermission(
        function(isGranted) {
          if (isGranted) {
          } else {
            // Request the permission
            window.plugins.speechRecognition.requestPermission(
              function() {
                // Request accepted, start recognition
              },
              function(err) {
                console.log(err);
              }
            );
          }
        },
        function(err) {
          console.log(err);
        }
      );
    },
    function(err) {
      console.log(err);
    }
  );
}

function listen() {
  status.textContent = 'Escuchando...';

  var test = app;
  console.log(test);

  const recognition = window.plugins.speechRecognition;
  // recognition.lang = 'es-ES';
  const options = {
    lenguage: 'es-ES'
  };
  recognition.startListening(
    function(result) {
      // Show results in the console
      console.log(result);
      const transcript = result[0];
      conversation.push({ role: 'user', content: transcript });
      try {
        callGPT3API(conversation).then(function(response) {
          // Añadir la respuesta del GPT-3 a la conversación
          conversation.push({ role: 'assistant', content: response });
          speak(response, () => {
            // Iniciar la escucha después de que termine la respuesta
            listen();
          });
        });
      } catch (error) {
        status.textContent = 'Error: ' + error.message;
      }
    },
    function(err) {
      console.error(err);
    },
    options
  );
}

// Agregar un argumento de callback a la función speak
function speak(text, onEnd) {
  const synthesis = window.TTS;
  // const utterance = new SpeechSynthesisUtterance(text);
  // utterance.lang = 'es-ES';
  synthesis.speak(text);

  // utterance.addEventListener('end', () => {
  //   status.textContent = 'Respuesta: ' + text;
  //   // Llamar al callback cuando termine la respuesta
  //   if (onEnd) {
  //     onEnd();
  //   }
  // });
}

function callGPT3API(text) {
  const apiKey = 'Bearer ApiKey';
  const headers = {
    Authorization: `Bearer ${apiKey}`
  };
  const body = {
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    messages: text,
    max_tokens: 250
  };

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
      messages: text,
      max_tokens: 250
    })
  })
    .then(function(response) {
      if (!response.ok) {
        const errorMessage = response.text();
        throw new Error(`Error en la API de OpenAI: ${errorMessage}`);
      }
      return response.json();
    })
    .then(function(result) {
      const data = result;
      return data.choices[0].message.content.trim();
    });
}

function speak(text) {
  const synthesis = window.TTS;

  // utterance.lang = 'es-ES';
  // Establecer la voz seleccionada
  // if (selectedVoice) {
  //   utterance.voice = selectedVoice;
  // }

  synthesis.speak(text).then(function() {
    status.textContent = 'Respuesta: ' + text;
    listen();
  });
}

app.initialize();
