// Scripts do Firebase (versão compatível com SW)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuração (Deve ser igual ao .env, mas hardcoded aqui pois SW não acessa .env facilmente)
const firebaseConfig = {
  apiKey: "AIzaSyA...SeuAPIKeyAqui...",
  authDomain: "priceus-notifications.firebaseapp.com",
  projectId: "priceus-notifications",
  storageBucket: "priceus-notifications.appspot.com",
  messagingSenderId: "378861208368",
  appId: "1:378861208368:web:abcd1234efgh5678"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificação em background recebida ', payload);
  // A notificação visual é gerada automaticamente pelo browser aqui
});