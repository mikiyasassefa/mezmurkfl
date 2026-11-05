/**
 * data.js â€” Data access layer for áˆáˆˆáŒˆáˆ•á‹­á‹ˆá‰µ áˆ˜á‹áˆ™áˆ­ áŠ­ááˆ
 * Uses localStorage for MVP. Swap this module for Firebase/REST calls in production.
 */

const DB = (() => {
  /* â”€â”€ Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const KEYS = {
    students:   'fmk_students',
    attendance: 'fmk_attendance',
    hymns:      'fmk_hymns',
    equipment:  'fmk_equipment',
    checkouts:  'fmk_checkouts',
    services:   'fmk_services',
    seeded:     'fmk_seeded_v5'
  };

  /* â”€â”€ Classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const CLASSES = [
    'á‹áˆ›áˆ¬ 4 áˆ€',
    'á‹áˆ›áˆ¬ 4 áˆˆ',
    'á‹áˆ›áˆ¬ 4 áˆ',
    'á‹áˆ›áˆ¬ 1',
    'á‹áˆ›áˆ¬ 3',
    'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€',
    'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ'
  ];

  const CONDITIONS  = ['Good', 'Fair', 'Needs Repair', 'Retired'];
  const CATEGORIES  = ['Musical Instrument', 'Audio/Visual', 'Printed Material', 'Furniture', 'Other'];

  /* â”€â”€ Generic helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  function _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    // Non-blocking cloud sync (only for main collections)
    if (window.CLOUD && CLOUD.isConnected()) {
      CLOUD.push(key, data).catch(() => {});
    }
  }
  function _id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function _now() { return new Date().toISOString(); }

  /* â”€â”€ Students CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const Students = {
    all() { return _get(KEYS.students); },
    byId(id) { return this.all().find(s => s.id === id) || null; },
    byClass(cls) { return this.all().filter(s => s.class === cls); },
    add(data) {
      const rows = this.all();
      const student = { id: _id(), createdAt: _now(), ...data };
      rows.push(student);
      _set(KEYS.students, rows);
      return student;
    },
    update(id, data) {
      const rows = this.all().map(s => s.id === id ? { ...s, ...data, updatedAt: _now() } : s);
      _set(KEYS.students, rows);
      return rows.find(s => s.id === id);
    },
    remove(id) {
      _set(KEYS.students, this.all().filter(s => s.id !== id));
      if (window.CLOUD && CLOUD.isConnected()) CLOUD.remove(KEYS.students, id).catch(() => {});
    },
    search(query, cls) {
      let rows = this.all();
      if (query) {
        const q = query.toLowerCase();
        rows = rows.filter(s =>
          s.name.toLowerCase().includes(q) ||
          (s.parentName || '').toLowerCase().includes(q)
        );
      }
      if (cls) rows = rows.filter(s => s.class === cls);
      return rows;
    }
  };

  /* â”€â”€ Attendance CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const Attendance = {
    all() { return _get(KEYS.attendance); },
    /**
     * @param {string} sessionDate - ISO date string YYYY-MM-DD
     * @param {string} cls - class name
     * @returns {Object[]} attendance records for that session+class
     */
    bySession(sessionDate, cls) {
      return this.all().filter(r => r.sessionDate === sessionDate && r.class === cls);
    },
    byStudent(studentId) {
      return this.all()
        .filter(r => r.studentId === studentId)
        .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
    },
    /**
     * Save a full session's attendance records.
     * Replaces existing records for the same session+class.
     */
    saveSession(sessionDate, cls, records) {
      const existing = this.all().filter(r => !(r.sessionDate === sessionDate && r.class === cls));
      const newRecs = records.map(r => ({ id: _id(), sessionDate, class: cls, ...r, savedAt: _now() }));
      _set(KEYS.attendance, [...existing, ...newRecs]);
    },
    getSessionDates() {
      const dates = [...new Set(this.all().map(r => r.sessionDate))];
      return dates.sort((a, b) => new Date(b) - new Date(a));
    },
    getSummaryForStudent(studentId, limit = 8) {
      const records = this.byStudent(studentId).slice(0, limit);
      return records.map(r => ({
        date: r.sessionDate,
        status: r.status // 'present' | 'absent' | 'excused'
      }));
    },
    getStatsForStudent(studentId) {
      const recs = this.byStudent(studentId);
      const total   = recs.length;
      const present = recs.filter(r => r.status === 'present').length;
      const absent  = recs.filter(r => r.status === 'absent').length;
      const excused = recs.filter(r => r.status === 'excused').length;
      const rate    = total > 0 ? Math.round((present / total) * 100) : 0;
      return { total, present, absent, excused, rate };
    }
  };

  /* â”€â”€ Hymns CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const Hymns = {
    all() { return _get(KEYS.hymns); },
    byId(id) { return this.all().find(h => h.id === id) || null; },
    add(data) {
      const rows = this.all();
      const hymn = { id: _id(), createdAt: _now(), ...data };
      rows.push(hymn);
      _set(KEYS.hymns, rows);
      return hymn;
    },
    update(id, data) {
      const rows = this.all().map(h => h.id === id ? { ...h, ...data, updatedAt: _now() } : h);
      _set(KEYS.hymns, rows);
      return rows.find(h => h.id === id);
    },
    remove(id) {
      _set(KEYS.hymns, this.all().filter(h => h.id !== id));
    },
    search(query, season) {
      let rows = this.all();
      if (query) {
        const q = query.toLowerCase();
        rows = rows.filter(h => h.title.toLowerCase().includes(q) || (h.season||'').toLowerCase().includes(q));
      }
      if (season) rows = rows.filter(h => h.season === season);
      return rows;
    }
  };

  /* â”€â”€ Equipment CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const Equipment = {
    all() { return _get(KEYS.equipment); },
    byId(id) { return this.all().find(e => e.id === id) || null; },
    add(data) {
      const rows = this.all();
      const item = { id: _id(), createdAt: _now(), maintenanceLogs: [], ...data };
      rows.push(item);
      _set(KEYS.equipment, rows);
      return item;
    },
    update(id, data) {
      const rows = this.all().map(e => e.id === id ? { ...e, ...data, updatedAt: _now() } : e);
      _set(KEYS.equipment, rows);
      return rows.find(e => e.id === id);
    },
    remove(id) {
      _set(KEYS.equipment, this.all().filter(e => e.id !== id));
      if (window.CLOUD && CLOUD.isConnected()) CLOUD.remove(KEYS.equipment, id).catch(() => {});
    },
    addMaintenanceLog(id, log) {
      const item = this.byId(id);
      if (!item) return;
      const logs = [...(item.maintenanceLogs || []), { id: _id(), date: _now(), ...log }];
      this.update(id, { maintenanceLogs: logs });
    }
  };

  /* â”€â”€ Checkouts CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const Checkouts = {
    all() { return _get(KEYS.checkouts); },
    active() { return this.all().filter(c => !c.returnedAt); },
    byEquipment(equipId) { return this.all().filter(c => c.equipmentId === equipId); },
    checkout(data) {
      const rows = this.all();
      const rec = { id: _id(), checkedOutAt: _now(), ...data, returnedAt: null };
      rows.push(rec);
      _set(KEYS.checkouts, rows);
      // Mark equipment as checked out
      Equipment.update(data.equipmentId, { checkedOut: true, borrower: data.borrower });
      return rec;
    },
    returnItem(checkoutId, condition, notes) {
      const rows = this.all().map(c =>
        c.id === checkoutId ? { ...c, returnedAt: _now(), returnCondition: condition, returnNotes: notes } : c
      );
      _set(KEYS.checkouts, rows);
      const rec = rows.find(c => c.id === checkoutId);
      if (rec) Equipment.update(rec.equipmentId, { checkedOut: false, borrower: null, condition });
    }
  };

  /* â”€â”€ Seed Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;

    /* â”€â”€ Students â”€â”€ */
    const studentData = [
      { name: 'Miriam Tesfaye',      age: 14, class: 'á‹áˆ›áˆ¬ 4 áˆ€', parentName: 'Tesfaye Alemu',   parentPhone: '+251911001001', parentEmail: 'tesfaye@email.com', enrollDate: '2024-01-15', notes: 'Strong lead vocalist' },
      { name: 'Bethlehem Girma',     age: 13, class: 'á‹áˆ›áˆ¬ 4 áˆ€', parentName: 'Girma Kebede',    parentPhone: '+251911001002', parentEmail: '', enrollDate: '2024-02-01', notes: '' },
      { name: 'Yohannes Hailu',      age: 15, class: 'á‹áˆ›áˆ¬ 4 áˆ€', parentName: 'Hailu Mekonen',   parentPhone: '+251911001003', parentEmail: 'hailu@email.com', enrollDate: '2024-01-20', notes: '' },
      { name: 'Selam Desta',         age: 12, class: 'á‹áˆ›áˆ¬ 4 áˆ€', parentName: 'Desta Worku',     parentPhone: '+251911001004', parentEmail: '', enrollDate: '2024-03-10', notes: 'Shy but talented' },
      { name: 'Dawit Bekele',        age: 14, class: 'á‹áˆ›áˆ¬ 4 áˆ€', parentName: 'Bekele Negash',   parentPhone: '+251911001005', parentEmail: '', enrollDate: '2024-01-15', notes: '' },
      { name: 'Sara Mulugeta',       age: 13, class: 'á‹áˆ›áˆ¬ 4 áˆˆ', parentName: 'Mulugeta Teklu',  parentPhone: '+251911002001', parentEmail: '', enrollDate: '2024-02-10', notes: '' },
      { name: 'Henok Tadesse',       age: 15, class: 'á‹áˆ›áˆ¬ 4 áˆˆ', parentName: 'Tadesse Welde',   parentPhone: '+251911002002', parentEmail: '', enrollDate: '2024-01-28', notes: '' },
      { name: 'Meron Alemu',         age: 12, class: 'á‹áˆ›áˆ¬ 4 áˆˆ', parentName: 'Alemu Biruk',     parentPhone: '+251911002003', parentEmail: 'alemu.b@email.com', enrollDate: '2024-03-05', notes: '' },
      { name: 'Natnael Yimer',       age: 14, class: 'á‹áˆ›áˆ¬ 4 áˆˆ', parentName: 'Yimer Zewdu',     parentPhone: '+251911002004', parentEmail: '', enrollDate: '2024-02-20', notes: '' },
      { name: 'Lidya Tesfaye',       age: 13, class: 'á‹áˆ›áˆ¬ 4 áˆˆ', parentName: 'Tesfaye Girma',   parentPhone: '+251911002005', parentEmail: '', enrollDate: '2024-03-15', notes: '' },
      { name: 'Abel Kebede',         age: 14, class: 'á‹áˆ›áˆ¬ 4 áˆ', parentName: 'Kebede Lemma',    parentPhone: '+251911003001', parentEmail: '', enrollDate: '2024-01-10', notes: '' },
      { name: 'Hiwot Girma',         age: 13, class: 'á‹áˆ›áˆ¬ 4 áˆ', parentName: 'Girma Tesfaw',    parentPhone: '+251911003002', parentEmail: '', enrollDate: '2024-02-08', notes: '' },
      { name: 'Robel Hailu',         age: 15, class: 'á‹áˆ›áˆ¬ 4 áˆ', parentName: 'Hailu Worku',     parentPhone: '+251911003003', parentEmail: '', enrollDate: '2024-01-22', notes: '' },
      { name: 'Tigist Alemu',        age: 12, class: 'á‹áˆ›áˆ¬ 4 áˆ', parentName: 'Alemu Dagne',     parentPhone: '+251911003004', parentEmail: 'dagne.a@email.com', enrollDate: '2024-03-12', notes: 'Needs extra practice' },
      { name: 'Yared Bekele',        age: 14, class: 'á‹áˆ›áˆ¬ 4 áˆ', parentName: 'Bekele Girma',    parentPhone: '+251911003005', parentEmail: '', enrollDate: '2024-02-14', notes: '' },
      { name: 'Bezawit Tadesse',     age: 8,  class: 'á‹áˆ›áˆ¬ 1',   parentName: 'Tadesse Mamo',    parentPhone: '+251911004001', parentEmail: '', enrollDate: '2024-04-01', notes: 'First-year student' },
      { name: 'Kirubel Tesfaye',     age: 7,  class: 'á‹áˆ›áˆ¬ 1',   parentName: 'Tesfaye Kiros',   parentPhone: '+251911004002', parentEmail: '', enrollDate: '2024-04-01', notes: '' },
      { name: 'Mahlet Alemu',        age: 8,  class: 'á‹áˆ›áˆ¬ 1',   parentName: 'Alemu Tesfaye',   parentPhone: '+251911004003', parentEmail: '', enrollDate: '2024-04-01', notes: 'Very enthusiastic' },
      { name: 'Binyam Yared',        age: 9,  class: 'á‹áˆ›áˆ¬ 1',   parentName: 'Yared Hailu',     parentPhone: '+251911004004', parentEmail: 'yared.h@email.com', enrollDate: '2024-04-05', notes: '' },
      { name: 'Fiyori Teklu',        age: 7,  class: 'á‹áˆ›áˆ¬ 1',   parentName: 'Teklu Negash',    parentPhone: '+251911004005', parentEmail: '', enrollDate: '2024-04-05', notes: '' },
      { name: 'Eyerusalem Girma',    age: 11, class: 'á‹áˆ›áˆ¬ 3',   parentName: 'Girma Welde',     parentPhone: '+251911005001', parentEmail: '', enrollDate: '2024-01-18', notes: '' },
      { name: 'Mikael Desta',        age: 10, class: 'á‹áˆ›áˆ¬ 3',   parentName: 'Desta Hailu',     parentPhone: '+251911005002', parentEmail: '', enrollDate: '2024-01-18', notes: '' },
      { name: 'Selamawit Kebede',    age: 11, class: 'á‹áˆ›áˆ¬ 3',   parentName: 'Kebede Abebe',    parentPhone: '+251911005003', parentEmail: '', enrollDate: '2024-02-05', notes: '' },
      { name: 'Daniel Tesfaye',      age: 10, class: 'á‹áˆ›áˆ¬ 3',   parentName: 'Tesfaye Daniel',  parentPhone: '+251911005004', parentEmail: 'tesfaye.d@email.com', enrollDate: '2024-02-10', notes: '' },
      { name: 'Yordanos Mekonen',    age: 11, class: 'á‹áˆ›áˆ¬ 3',   parentName: 'Mekonen Haile',   parentPhone: '+251911005005', parentEmail: '', enrollDate: '2024-03-01', notes: '' },
      { name: 'Fasika Lemma',        age: 16, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€', parentName: 'Lemma Tesfaye',  parentPhone: '+251911006001', parentEmail: '', enrollDate: '2023-09-01', notes: 'Section leader' },
      { name: 'Bereket Hailu',       age: 17, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€', parentName: 'Hailu Alemu',    parentPhone: '+251911006002', parentEmail: '', enrollDate: '2023-09-01', notes: '' },
      { name: 'Tsion Girma',         age: 16, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€', parentName: 'Girma Mamo',     parentPhone: '+251911006003', parentEmail: 'girma.m@email.com', enrollDate: '2023-09-15', notes: '' },
      { name: 'Semere Bekele',       age: 18, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€', parentName: 'Bekele Tesfaw',  parentPhone: '+251911006004', parentEmail: '', enrollDate: '2023-09-01', notes: '' },
      { name: 'Hana Tadesse',        age: 15, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€', parentName: 'Tadesse Kiros',  parentPhone: '+251911006005', parentEmail: '', enrollDate: '2024-01-10', notes: '' },
      { name: 'Yonas Tesfaye',       age: 17, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ', parentName: 'Tesfaye Mamo',   parentPhone: '+251911007001', parentEmail: '', enrollDate: '2023-09-01', notes: 'Assists with teaching' },
      { name: 'Mekdes Alemu',        age: 16, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ', parentName: 'Alemu Girma',    parentPhone: '+251911007002', parentEmail: '', enrollDate: '2023-09-10', notes: '' },
      { name: 'Tekeste Hailu',       age: 18, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ', parentName: 'Hailu Tekle',    parentPhone: '+251911007003', parentEmail: '', enrollDate: '2023-09-01', notes: '' },
      { name: 'Lidya Kebede',        age: 15, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ', parentName: 'Kebede Mamo',    parentPhone: '+251911007004', parentEmail: '', enrollDate: '2024-01-20', notes: '' },
      { name: 'Amanuel Desta',       age: 16, class: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ', parentName: 'Desta Alemu',    parentPhone: '+251911007005', parentEmail: 'desta.a@email.com', enrollDate: '2024-02-01', notes: '' },
    ];
    studentData.forEach(s => Students.add(s));

    /* â”€â”€ Attendance â€” 8 past Sundays â”€â”€ */
    const allStudents = Students.all();
    const statuses    = ['present', 'present', 'present', 'present', 'present', 'absent', 'excused'];
    for (let w = 7; w >= 0; w--) {
      const d = new Date();
      d.setDate(d.getDate() - w * 7 - ((d.getDay() + 1) % 7)); // last 8 Sundays
      const dateStr = d.toISOString().split('T')[0];
      CLASSES.forEach(cls => {
        const classStudents = allStudents.filter(s => s.class === cls);
        const records = classStudents.map(s => ({
          studentId: s.id,
          studentName: s.name,
          status: statuses[Math.floor(Math.random() * statuses.length)]
        }));
        if (records.length) Attendance.saveSession(dateStr, cls, records);
      });
    }

    /* â”€â”€ Equipment â”€â”€ */
    const equipData = [
      { name: 'Keyboard / Piano', category: 'Musical Instrument', quantity: 1, condition: 'Good', location: 'Main Hall', description: 'Casio CT-X700, 61 keys', checkedOut: false, borrower: null },
      { name: 'Acoustic Guitar', category: 'Musical Instrument', quantity: 2, condition: 'Good', location: 'Storage Room A', description: 'Classical nylon-string guitars', checkedOut: false, borrower: null },
      { name: 'Tambourine', category: 'Musical Instrument', quantity: 5, condition: 'Fair', location: 'Storage Room A', description: 'Various sizes', checkedOut: false, borrower: null },
      { name: 'Sistrum (áˆµáˆµá‰³)', category: 'Musical Instrument', quantity: 8, condition: 'Good', location: 'Storage Room A', description: 'Traditional Ethiopian percussion', checkedOut: false, borrower: null },
      { name: 'Worship Drum (áŠ¨á‰ áˆ®)', category: 'Musical Instrument', quantity: 3, condition: 'Good', location: 'Main Hall', description: 'Large Ethiopian ceremonial drums', checkedOut: false, borrower: null },
      { name: 'Wireless Microphone', category: 'Audio/Visual', quantity: 2, condition: 'Good', location: 'AV Cabinet', description: 'Shure BLX24 handheld wireless system', checkedOut: false, borrower: null },
      { name: 'Portable Speaker', category: 'Audio/Visual', quantity: 1, condition: 'Fair', location: 'AV Cabinet', description: 'JBL EON610 â€” needs speaker cover replaced', checkedOut: false, borrower: null },
      { name: 'Hymn Book (á‹áˆ›áˆ¬ áˆ˜áŒ½áˆá)', category: 'Printed Material', quantity: 20, condition: 'Fair', location: 'Library Shelf', description: 'Ethiopian Orthodox Sunday School hymnal', checkedOut: false, borrower: null },
      { name: 'Music Stands', category: 'Furniture', quantity: 6, condition: 'Good', location: 'Storage Room B', description: 'Folding music stands', checkedOut: false, borrower: null },
      { name: 'Projector', category: 'Audio/Visual', quantity: 1, condition: 'Needs Repair', location: 'AV Cabinet', description: 'Bulb needs replacing â€” submitted maintenance request', checkedOut: false, borrower: null },
    ];
    equipData.forEach(e => Equipment.add(e));

    // Sample checkout
    const equip = Equipment.all();
    if (equip.length > 0) {
      Checkouts.checkout({
        equipmentId: equip[1].id,
        borrower: 'Yonas Tesfaye',
        purpose: 'Youth rehearsal â€” Saturday',
        expectedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    /* â”€â”€ Services seed â”€â”€ */
    const allStudentsNow = Students.all();
    const getStudentsByClass = cls => allStudentsNow.filter(s => s.class === cls).map(s => s.id);
    const servicesData = [
      {
        name: 'á‰…á‹³áˆ´ â€” á‹•áˆˆá‰° áˆ°áŠ•á‰ á‰µ',
        description: 'The main Sunday Divine Liturgy choir service. Senior students lead worship before the congregation.',
        schedule: 'Every Sunday 6:00 AM',
        department: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€',
        studentIds: getStudentsByClass('áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆ€')
      },
      {
        name: 'áˆ°áŠ•á‰ á‰µ á‰µ/á‰¤á‰µ â€” á‰…á‹³áˆ´',
        description: 'Sunday School opening worship service. Intermediate students sing hymns before class begins.',
        schedule: 'Every Sunday 9:00 AM',
        department: 'á‹áˆ›áˆ¬ 4 áˆ€',
        studentIds: getStudentsByClass('á‹áˆ›áˆ¬ 4 áˆ€').concat(getStudentsByClass('á‹áˆ›áˆ¬ 4 áˆˆ'))
      },
      {
        name: 'á‹áˆ²áŠ« á‹áˆ›áˆ¬ â€” Easter Choir',
        description: 'Special Easter Vigil choir performance. Selected members from advanced classes participate.',
        schedule: 'Easter Saturday Evening',
        department: 'áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ',
        studentIds: getStudentsByClass('áˆ€á‹‹áˆ­á‹« á‰°áˆá‹•áŠ® áˆˆ')
      }
    ];
    servicesData.forEach(s => Services.add(s));

    localStorage.setItem(KEYS.seeded, '1');
  }

  /* â”€â”€ Cloud sync pull â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  async function pullFromCloud() {
    if (window.CLOUD && CLOUD.isConnected()) {
      await CLOUD.pull();
    }
  }

  /* â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return {
    Students, Attendance, Equipment, Checkouts, Services,
    CLASSES, CONDITIONS, CATEGORIES,
    seed, pullFromCloud, _id, _now
  };
})();

// Auto-seed on load
document.addEventListener('DOMContentLoaded', () => DB.seed());

