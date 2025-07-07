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
  const toggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';

  document.body.classList.add(`${savedTheme}-mode`);
  if (toggle) toggle.checked = savedTheme === 'dark';

  if (toggle) {
    toggle.addEventListener('change', () => {
      const selectedTheme = toggle.checked ? 'dark' : 'light';
      document.body.className = '';
      document.body.classList.add(`${selectedTheme}-mode`);
      localStorage.setItem('theme', selectedTheme);
    });
  }
}

function setupThresholdListener() {
  const input = document.getElementById('threshold-input');
  if (input) {
    input.addEventListener('input', () => {
      loadCalendar(); // Recalculate on input
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

      classes.sort((a, b) => new Date(a.date) - new Date(b.date));

      classes.forEach(c => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';

        const btn = document.createElement('button');
        btn.innerText = "Mark Present";
        btn.setAttribute('data-id', c.id);
        btn.onclick = () => markAttendance(c.id);

        db.collection('attendance')
          .doc(`${uid}_${c.id}`)
          .get()
          .then(doc => {
            if (doc.exists) {
              btn.innerText = "✅ Marked";
              btn.disabled = true;
              btn.classList.add("marked");

              const undoBtn = document.createElement('button');
              undoBtn.innerText = "Undo";
              undoBtn.style.marginLeft = '10px';
              undoBtn.onclick = () => undoAttendance(c.id);
              row.appendChild(undoBtn);
            }
          });

        row.innerHTML = `<span><strong>${formatDate(c.date)}</strong> - ${c.subject}</span>`;
        row.appendChild(btn);
        attendanceSection.appendChild(row);
      });

      // ✅ Summary calculation
      Promise.all(classes.map(c => {
        return db.collection('attendance')
          .doc(`${uid}_${c.id}`)
          .get()
          .then(doc => doc.exists ? 1 : 0);
      })).then(attendedArray => {
        const total = classes.length;
        const attended = attendedArray.reduce((a, b) => a + b, 0);
        const percent = total === 0 ? 0 : Math.round((attended / total) * 100);

        // 🧠 Threshold logic
        const thresholdInput = document.getElementById('threshold-input');
        let threshold = parseFloat(thresholdInput?.value || "75");
        if (isNaN(threshold)) threshold = 75;

        localStorage.setItem('attendance-threshold', threshold);
        const needed = Math.max(0, Math.ceil((threshold / 100) * total - attended));

        // ✨ Update UI
        document.getElementById('total-classes').innerText = total;
        document.getElementById('attended-classes').innerText = attended;
        document.getElementById('attendance-percent').innerText = `${percent}%`;
        document.getElementById('classes-needed').innerText = needed;

        // Load saved threshold
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
  const docRef = db.collection('attendance').doc(`${uid}_${classId}`);

  docRef.set({ marked: true }).then(() => {
    loadCalendar();
  });
}

function undoAttendance(classId) {
  const uid = auth.currentUser.uid;
  const docRef = db.collection('attendance').doc(`${uid}_${classId}`);

  docRef.delete().then(() => {
    loadCalendar();
  });
}
