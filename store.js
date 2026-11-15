// Ligação com o Firebase (login Google + banco Firestore). Sem regras de tela aqui.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, setDoc, deleteDoc }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJRPaIAJaxY_3h3nySD8wNAOhvOQVLS3g",
  authDomain: "somnium-atelie.firebaseapp.com",
  projectId: "somnium-atelie",
  storageBucket: "somnium-atelie.firebasestorage.app",
  messagingSenderId: "889408355489",
  appId: "1:889408355489:web:40101b4ce4a28d7fc384e0"
};

export function createStore() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  const prov = new GoogleAuthProvider();
  return {
    onAuth(cb) { return onAuthStateChanged(auth, cb); },
    async signIn() {
      try { await signInWithPopup(auth, prov); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) await signInWithRedirect(auth, prov);
        else throw e;
      }
    },
    signOut() { return signOut(auth); },
    subscribe(name, cb, err) {
      return onSnapshot(collection(db, name), snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), err);
    },
    newId(name) { return doc(collection(db, name)).id; },
    save(name, id, data) { return setDoc(doc(db, name, id), data); },
    remove(name, id) { return deleteDoc(doc(db, name, id)); }
  };
}
