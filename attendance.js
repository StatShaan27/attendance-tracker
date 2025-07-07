document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      loadCalendar();
      setupTheme();
      setupThresholdListener();
    }
  });
});

function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(`${savedTheme}-mode`);
}

function setupThresholdListener() {
  const input = document.getElementById('threshold-input');
  if (input) {
    input.addEventListener('input', () => {
      loadCalendar();
    });
  }
}

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

      // Group by month-year
      const grouped = {};
      classes.forEach(c => {
        const d = new Date(c.date);
        const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
      });

      const groupKeys = Object.keys(grouped).sort((a, b) => {
        const [ma, ya] = a.split(' ');
        const [mb, yb] = b.split(' ');
        return new Date(`${ma} 1, ${ya}`) - new Date(`${mb} 1, ${yb}`);
      });

      groupKeys.forEach(key => {
        const details = document.createElement('details');
        details.open = true;
        const summary = document.createElement('summary');
        summary.innerText = key;
        details.appendChild(summary);

        grouped[key].forEach(c => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.marginBottom = '8px';

          const span = document.createElement('span');
          span.innerHTML = `<strong>${formatDate(c.date)}</strong> - ${c.subject}`;
          row.appendChild(span);

          const btn = document.createElement('button');
          btn.innerText = "Mark Present";
          btn.setAttribute('data-id', c.id);
          btn.onclick = () => markAttendance(c.id);

          db.collection('attendance')
            .doc(`${uid}_${c.id}`)
            .get()
            .then(doc => {
              if (doc.exists) {
                btn.innerText = "Marked";
                btn.disabled = true;
                btn.classList.add("marked");

                const undoBtn = document.createElement('button');
                undoBtn.innerText = "Undo";
                undoBtn.style.marginLeft = '10px';
                undoBtn.onclick = () => undoAttendance(c.id);
                row.appendChild(undoBtn);
              }
            });

          row.appendChild(btn);
          details.appendChild(row);
        });

        attendanceSection.appendChild(details);
      });

      // 📊 Summary
      Promise.all(classes.map(c => {
        return db.collection('attendance')
          .doc(`${uid}_${c.id}`)
          .get()
          .then(doc => doc.exists ? 1 : 0);
      })).then(attendedArray => {
        const total = classes.length;
        const attended = attendedArray.reduce((a, b) => a + b, 0);
        const thresholdInput = document.getElementById('threshold-input');
        let threshold = parseFloat(thresholdInput?.value || "75");
        if (isNaN(threshold)) threshold = 75;
        localStorage.setItem('attendance-threshold', threshold);
        const needed = Math.max(0, Math.ceil((threshold / 100) * total - attended));

        document.getElementById('total-classes').innerText = total;
        document.getElementById('attended-classes').innerText = attended;
        document.getElementById('attendance-percent').innerText = `${Math.round(attended / total * 100)}%`;
        document.getElementById('classes-needed').innerText = needed;

        const savedThreshold = localStorage.getItem('attendance-threshold');
        if (savedThreshold && thresholdInput) {
          thresholdInput.value = savedThreshold;
        }
      });
    });
}

function formatDate(rawDate) {
  const parsed = new Date(rawDate);
  if (!isNaN(parsed)) {
    return parsed.toDateString().slice(4);
  }
  return rawDate;
}

function markAttendance(classId) {
  const uid = auth.currentUser.uid;
  db.collection('attendance').doc(`${uid}_${classId}`).set({ marked: true }).then(() => {
    loadCalendar();
  });
}

function undoAttendance(classId) {
  const uid = auth.currentUser.uid;
  db.collection('attendance').doc(`${uid}_${classId}`).delete().then(() => {
    loadCalendar();
  });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("Logout error:", error);
  });
}
