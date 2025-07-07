document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      loadCalendar();
    }
  });
});

function loadCalendar() {
  const uid = auth.currentUser.uid;
  const attendanceSection = document.getElementById('attendance-section');
  attendanceSection.innerHTML = '';

  db.collection('calendar').orderBy('date').get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `${data.date} - ${data.subject} <button onclick="markAttendance('${doc.id}')">Mark Present</button>`;
      attendanceSection.appendChild(div);
    });
  });
}

function markAttendance(dateId) {
  const uid = auth.currentUser.uid;
  db.collection('attendance').add({
    userId: uid,
    classId: dateId,
    timestamp: new Date()
  });
  alert('Attendance marked!');
}
