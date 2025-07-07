document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (!user || user.email !== 'admin@example.com') {
      window.location.href = 'index.html';
    } else {
      loadClassDates();
    }
  });
});

function addClassDate() {
  const date = document.getElementById('classDate').value;
  const subject = document.getElementById('subject').value;

  db.collection('calendar').add({
    date: date,
    subject: subject
  }).then(() => {
    loadClassDates();
  });
}

function loadClassDates() {
  const list = document.getElementById('calendarList');
  list.innerHTML = '';

  db.collection('calendar').orderBy('date').get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.innerText = `${data.date} - ${data.subject}`;
      list.appendChild(div);
    });
  });
}
