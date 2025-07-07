const firebaseConfig = {
  apiKey: "AIzaSyDtEZLPbQa0065-OHEvIjXCO_zblsUKDGQ",
  authDomain: "attendance-tracker-fe94a.firebaseapp.com",
  projectId: "attendance-tracker-fe94a",
  storageBucket: "attendance-tracker-fe94a.firebasestorage.app",
  messagingSenderId: "1094684941898",
  appId: "1:1094684941898:web:65a649bb4d2b2813c850b3",
  measurementId: "G-C506D8WLSX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
