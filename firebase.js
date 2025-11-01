import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyB412W6L0wiGb7grNdttAlnnsQiUwAMmZI',
    authDomain: 'fir-duclm.firebaseapp.com',
    projectId: 'fir-duclm',
    storageBucket: 'fir-duclm.firebasestorage.app',
    messagingSenderId: '258641491735',
    appId: '1:258641491735:web:ce12add6022750b96a6952',
    measurementId: 'G-TXKTQQGRJL',
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export default firebase;
