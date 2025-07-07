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
    input.addEventListener('change', () => {
      loadCalendar(); // only when user is done editing
    });
  }
}


async function loadCalendar() {
  const uid = auth.currentUser.uid;
  const attendanceSection = document.getElementById('attendance-section');
  attendanceSection.innerHTML = '';

  const calendarSnapshot = await db.collection('calendar').orderBy('date').get();

  const classes = calendarSnapshot.docs.map(doc => ({
    id: doc.id,
    date: doc.data().date,
    subject: doc.data().subject
  }));

  // Sort
  classes.sort((a, b) => new Date(a.date) - new Date(b.date));

  // For summary count
  let attendedCount = 0;

  const rowsHTML = await Promise.all(classes.map(async c => {
    const attendanceDoc = await db.collection('attendance').doc(`${uid}_${c.id}`).get();
    const isMarked = attendanceDoc.exists;
    if (isMarked) attendedCount++;

    const markButton = isMarked
      ? `<button class="marked" disabled>✅ Marked</button>
         <button onclick="undoAttendance('${c.id}')" style="margin-left: 10px;">Undo</button>`
      : `<button onclick="markAttendance('${c.id}')">Mark Present</button>`;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span><strong>${formatDate(c.date)}</strong> - ${c.subject}</span>
        ${markButton}
      </div>
    `;
  }));

  attendanceSection.innerHTML = rowsHTML.join('');

  // Summary
  const total = classes.length;
  const thresholdInput = document.getElementById('threshold-input');
  let threshold = parseFloat(thresholdInput?.value || "75");
  if (isNaN(threshold)) threshold = 75;
  localStorage.setItem('attendance-threshold', threshold);

  const percent = total === 0 ? 0 : Math.round((attendedCount / total) * 100);
  const needed = Math.max(0, Math.ceil((threshold / 100) * total - attendedCount));

  document.getElementById('total-classes').innerText = total;
  document.getElementById('attended-classes').innerText = attendedCount;
  document.getElementById('attendance-percent').innerText = `${percent}%`;
  document.getElementById('classes-needed').innerText = needed;

  // Set input to saved value
  if (thresholdInput) thresholdInput.value = threshold;
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
