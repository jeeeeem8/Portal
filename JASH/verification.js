// ----- Firebase Config -----
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

const googleBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const messageEl = document.getElementById('message');

// Google Sign-In
googleBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      userName.textContent = `Name: ${user.displayName}`;
      userEmail.textContent = `Email: ${user.email}`;
      userInfo.classList.remove('hidden');
      googleBtn.classList.add('hidden');
      messageEl.textContent = "Signed in successfully!";
    })
    .catch(error => {
      console.error(error);
      messageEl.textContent = "Sign in failed. Try again.";
    });
});

// Sign Out
signOutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      userInfo.classList.add('hidden');
      googleBtn.classList.remove('hidden');
      messageEl.textContent = "Signed out successfully!";
    })
    .catch(error => {
      console.error(error);
      messageEl.textContent = "Sign out failed. Try again.";
    });
});

// Check if user is already signed in
auth.onAuthStateChanged(user => {
  if(user){
    userName.textContent = `Name: ${user.displayName}`;
    userEmail.textContent = `Email: ${user.email}`;
    userInfo.classList.remove('hidden');
    googleBtn.classList.add('hidden');
  } else {
    userInfo.classList.add('hidden');
    googleBtn.classList.remove('hidden');
  }
});
