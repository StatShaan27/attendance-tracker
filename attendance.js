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

  db.collection('calendar')
    .orderBy('date')
    .get()
    .then(snapshot => {
      const classes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          subject: data.subject
        };
      });

      // Sort by date (if not already sorted)
      classes.sort((a, b) => new Date(a.date) - new Date(b.date));

      classes.forEach(c => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';

        row.innerHTML = `
          <span><strong>${formatDate(c.date)}</strong> - ${c.subject}</span>
          <button onclick="markAttendance('${c.id}')">Mark Present</button>
        `;
        attendanceSection.appendChild(row);
      });
    });
}

function formatDate(rawDate) {
  // Try to auto-fix common date inputs like "21st Aug" or "Aug 21st"
  const parsed = new Date(rawDate);
  if (!isNaN(parsed)) {
    return parsed.toDateString().slice(4); // e.g., "Aug 21 2025"
  }
  return rawDate; // fallback
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
