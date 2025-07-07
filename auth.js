function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      if (email === 'admin@example.com') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    })
    .catch(error => {
      document.getElementById('loginStatus').innerText = error.message;
    });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html"; // ✅ Redirect to login page
  }).catch((error) => {
    console.error("Logout error:", error);
  });
}
