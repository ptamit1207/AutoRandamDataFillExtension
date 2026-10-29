(() => {
  if (window.__autoFillRun) return;

  // ---------- random helpers ----------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const digits = (n) => Array.from({ length: n }, () => int(0, 9)).join('');
  const letters = (n) => Array.from({ length: n }, () => String.fromCharCode(65 + int(0, 25))).join('');
  const pad = (n) => String(n).padStart(2, '0');

  const MALE = ['Aarav', 'Rohan', 'Vikram', 'Arjun', 'Karan', 'Rahul', 'Amit', 'Siddharth', 'Nikhil', 'Manish'];
  const FEMALE = ['Priya', 'Ananya', 'Neha', 'Sneha', 'Kavya', 'Pooja', 'Riya', 'Isha', 'Meera', 'Divya'];
  const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Mehta', 'Reddy', 'Nair', 'Joshi', 'Kapoor'];
  const PLACES = [
    { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
    { city: 'Delhi', state: 'Delhi', pin: '110001' },
    { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
    { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
    { city: 'Chennai', state: 'Tamil Nadu', pin: '600001' },
    { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
    { city: 'Pune', state: 'Maharashtra', pin: '411001' },
    { city: 'Lucknow', state: 'Uttar Pradesh', pin: '226001' }
  ];
  const COMPANIES = ['Acme Technologies', 'Bluewave Solutions', 'Nimbus Labs', 'Orbit Systems', 'Zenith Softworks'];
  const STREETS = ['MG Road', 'Park Street', 'Nehru Nagar', 'Gandhi Marg', 'Station Road', 'Lake View Colony'];
  const LOREM = [
    'This is a sample message generated for testing purposes.',
    'Please ignore this entry, it was created by an automated form filler.',
    'Testing the form submission flow with random data.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  ];

  function makeProfile() {
    const gender = pick(['Male', 'Female']);
    const first = pick(gender === 'Male' ? MALE : FEMALE);
    const last = pick(LAST);
    const place = pick(PLACES);
    const dob = new Date(Date.now() - int(18 * 365, 50 * 365) * 86400000);
    const tag = int(100, 999);
    return {
      gender, first, last, middle: pick(MALE.concat(FEMALE)),
      full: `${first} ${last}`,
      username: `${first}${last}${tag}`.toLowerCase(),
      email: `${first}.${last}${tag}@example.com`.toLowerCase(),
      phone: pick(['6', '7', '8', '9']) + digits(9),
      password: `Test@${int(1000, 9999)}pass`,
      company: pick(COMPANIES),
      address: `${int(1, 250)}, ${pick(STREETS)}`,
      address2: `Near ${pick(STREETS)}`,
      city: place.city, state: place.state, pin: place.pin, country: 'India',
      dob, age: new Date().getFullYear() - dob.getFullYear(),
      website: `https://www.${last.toLowerCase()}${tag}.com`,
      aadhaar: String(int(2, 9)) + digits(11),
      pan: letters(5) + digits(4) + letters(1),
      sentence: pick(LOREM),
      paragraph: LOREM.join(' ')
    };
  }

  // ---------- field discovery ----------
  const SKIP = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'file', 'search']);

  function collect(root, out) {
    root.querySelectorAll('input,select,textarea').forEach((e) => out.push(e));
    root.querySelectorAll('*').forEach((n) => { if (n.shadowRoot) collect(n.shadowRoot, out); });
  }

  function labelText(el) {
    let t = '';
    if (el.labels) for (const l of el.labels) t += ' ' + l.textContent;
    const lb = el.getAttribute('aria-labelledby');
    if (lb) lb.split(/\s+/).forEach((id) => { const n = document.getElementById(id); if (n) t += ' ' + n.textContent; });
    if (!t.trim()) {
      const box = el.closest('div,li,td,p,fieldset');
      const l = box && box.querySelector('label,legend');
      if (l) t += ' ' + l.textContent;
    }
    return t;
  }

  function signals(el) {
    return [el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
      el.getAttribute('autocomplete'), el.getAttribute('data-testid'), labelText(el)]
      .join(' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/[_\-.\[\]]+/g, ' ');
  }

  function isVisible(el, type) {
    if (type === 'checkbox' || type === 'radio') {
      if (el.getClientRects().length > 0) return true;
      return !!(el.labels && [...el.labels].some((l) => l.getClientRects().length > 0));
    }
    if (el.getClientRects().length === 0) return false;
    return getComputedStyle(el).visibility !== 'hidden';
  }

  // order matters: first match wins
  const RULES = [
    ['confirmPassword', /(confirm|re ?enter|retype|repeat|verify|again).{0,15}pass|pass.{0,15}(confirm|again)/],
    ['password', /pass ?word|passwd|\bpwd\b|\bpass\b/],
    ['email', /e ?mail/],
    ['phone', /phone|mobile|\bcell\b|whats ?app|telephone|\btel\b|contact (no|num)/],
    ['cardNumber', /card (number|no)|cc ?num/],
    ['cvv', /\bcvv\b|\bcvc\b|security code/],
    ['cardExpiry', /expir|valid thru/],
    ['pin', /pin ?code|\bzip|postal|post ?code/],
    ['otp', /\botp\b|verification code|one time/],
    ['aadhaar', /aa?dh?a+r/],
    ['pan', /\bpan\b/],
    ['username', /user ?name|user ?id|login|handle|nick ?name|screen ?name/],
    ['company', /company|organi[sz]ation|employer|business|\bfirm\b|institute|college|school|university/],
    ['parent', /father|mother|guardian|parent|spouse|husband|\bwife\b/],
    ['firstName', /first ?name|\bfname\b|given ?name|fore ?name/],
    ['middleName', /middle/],
    ['lastName', /last ?name|\blname\b|sur ?name|family ?name/],
    ['dob', /\bdob\b|birth/],
    ['age', /\bage\b/],
    ['address2', /address ?(line)? ?2|addr ?2|apartment|\bapt\b|suite|landmark|locality/],
    ['address', /address|street|\baddr\b/],
    ['city', /city|town|district/],
    ['state', /\bstate\b|province|region/],
    ['country', /country|nation/],
    ['gender', /gender|\bsex\b/],
    ['website', /website|web ?site|\burl\b|portfolio|linkedin|github/],
    ['number', /salary|income|amount|price|budget|quantity|\bqty\b|experience|years|marks|percentage/],
    ['subject', /subject|title|headline/],
    ['message', /message|comment|description|\bbio\b|about|feedback|query|remarks|notes|details|reason|cover letter/],
    ['fullName', /full ?name|your name|\bname\b|applicant|candidate/]
  ];

  function keyFor(sig) {
    for (const [k, re] of RULES) if (re.test(sig)) return k;
    return null;
  }

  // ---------- value generation ----------
  function fmtDate(d, placeholder) {
    const ph = (placeholder || '').toLowerCase();
    const sep = (ph.match(/[\/\-.]/) || ['/'])[0];
    const y = d.getFullYear(), m = pad(d.getMonth() + 1), dd = pad(d.getDate());
    if (/y{2,4}.?m{2}.?d{2}/.test(ph)) return [y, m, dd].join(sep);
    if (/m{2}.?d{2}.?y/.test(ph)) return [m, dd, y].join(sep);
    return [dd, m, y].join(sep);
  }
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function clampStr(v, el) {
    if (el.min && v < el.min) v = el.min;
    if (el.max && v > el.max) v = el.max;
    return v;
  }

  function randomNumber(el, key, p) {
    if (key === 'age') return String(p.age);
    const min = el.min !== '' && !isNaN(el.min) ? +el.min : 0;
    const max = el.max !== '' && !isNaN(el.max) ? +el.max : Math.max(min + 100, 100);
    return String(int(min, max));
  }

  function textValue(key, p, el) {
    switch (key) {
      case 'confirmPassword': case 'password': return p.password;
      case 'email': return p.email;
      case 'phone': return p.phone;
      case 'cardNumber': return '4111111111111111';
      case 'cvv': return '123';
      case 'cardExpiry': return '12/30';
      case 'pin': return p.pin;
      case 'otp': return digits(6);
      case 'aadhaar': return p.aadhaar;
      case 'pan': return p.pan;
      case 'username': return p.username;
      case 'company': return p.company;
      case 'parent': return `${pick(MALE)} ${p.last}`;
      case 'firstName': return p.first;
      case 'middleName': return p.middle;
      case 'lastName': return p.last;
      case 'dob': return fmtDate(p.dob, el.placeholder);
      case 'age': return String(p.age);
      case 'address2': return p.address2;
      case 'address': return p.address;
      case 'city': return p.city;
      case 'state': return p.state;
      case 'country': return p.country;
      case 'gender': return p.gender;
      case 'website': return p.website;
      case 'number': return String(int(1, 100));
      case 'subject': return 'Test subject ' + int(1, 999);
      case 'message': return p.paragraph;
      case 'fullName': return p.full;
      default: return null;
    }
  }

  function valueFor(el, type, sig, p) {
    const key = keyFor(sig);
    switch (type) {
      case 'email': return p.email;
      case 'tel': return p.phone;
      case 'password': return p.password;
      case 'url': return p.website;
      case 'color': return '#' + digits(6);
      case 'range': {
        const min = +(el.min || 0), max = +(el.max || 100);
        return String(Math.round((min + max) / 2));
      }
      case 'date': {
        const d = key === 'dob' ? p.dob : new Date(Date.now() + int(1, 60) * 86400000);
        return clampStr(iso(d), el);
      }
      case 'time': return `${pad(int(9, 18))}:${pad(pick([0, 15, 30, 45]))}`;
      case 'datetime-local': return clampStr(`${iso(new Date(Date.now() + int(1, 60) * 86400000))}T${pad(int(9, 18))}:00`, el);
      case 'month': return iso(new Date()).slice(0, 7);
      case 'week': return null;
      case 'number': {
        const v = textValue(key, p, el);
        return v !== null && /^\d+(\.\d+)?$/.test(v) ? v : randomNumber(el, key, p);
      }
    }
    if (el.tagName === 'TEXTAREA') return textValue(key, p, el) || p.paragraph;
    const v = textValue(key, p, el);
    if (v !== null) return v;
    return pick(['Test', 'Sample', 'Demo']) + ' ' + int(100, 999);
  }

  // ---------- setters (React/Angular/Vue friendly) ----------
  function fire(el, names) {
    for (const n of names) {
      const ev = n === 'input' ? new InputEvent('input', { bubbles: true, composed: true }) : new Event(n, { bubbles: true, composed: true });
      el.dispatchEvent(ev);
    }
  }

  function setValue(el, val) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    el.focus && el.focus();
    setter.call(el, val);
    fire(el, ['input', 'change', 'blur']);
  }

  function flash(el) {
    const old = el.style.outline;
    el.style.outline = '2px solid #22c55e';
    setTimeout(() => { el.style.outline = old; }, 1200);
  }

  // ---------- select / radio / checkbox ----------
  function fillSelect(el, sig, p) {
    const opts = [...el.options].filter((o) => !o.disabled);
    let valid = opts.filter((o) => o.value !== '' && !/^\s*(select|choose|--|please|pick)/i.test(o.text));
    if (!valid.length) valid = opts.slice(1);
    if (!valid.length) return false;
    const key = keyFor(sig);
    const want = key === 'country' ? 'india' : key === 'state' ? p.state.toLowerCase()
      : key === 'gender' ? p.gender.toLowerCase() : key === 'city' ? p.city.toLowerCase() : null;
    let chosen = want && valid.find((o) => o.text.trim().toLowerCase() === want || o.value.toLowerCase() === want);
    if (!chosen && want) chosen = valid.find((o) => o.text.toLowerCase().includes(want));
    if (!chosen) chosen = pick(valid);
    if (el.multiple) [...el.options].forEach((o) => { o.selected = o === chosen; });
    setValue(el, chosen.value);
    return true;
  }

  function fillRadioGroup(group, p) {
    const usable = group.filter((r) => !r.disabled);
    if (!usable.length) return false;
    const text = (r) => (labelText(r) + ' ' + r.value).toLowerCase();
    let chosen = null;
    const isGender = keyFor(signals(usable[0]) + ' ' + usable[0].name) === 'gender' ||
      usable.some((r) => /^\s*(male|female)\s*$/.test(labelText(r).toLowerCase() + '') || /^(male|female)$/i.test(r.value));
    if (isGender)
      chosen = usable.find((r) => text(r).includes(p.gender.toLowerCase()) && !(p.gender === 'Male' && /female/.test(text(r))));
    if (!chosen) chosen = pick(usable);
    chosen.click();
    return true;
  }

  function fillCheckbox(el, sig) {
    let want;
    if (/agree|terms|accept|consent|privacy|policy|condition|declar|confirm/.test(sig)) want = true;
    else if (/remember|keep me/.test(sig)) want = false;
    else want = Math.random() < 0.5;
    if (el.checked !== want) el.click();
    return true;
  }

  // ---------- main ----------
  window.__autoFillRun = (opts = {}) => {
    const overwrite = opts.overwrite !== false;
    const p = makeProfile();
    const els = [];
    collect(document, els);
    const radios = new Map();
    let filled = 0;

    for (const el of els) {
      try {
        if (el.disabled || el.readOnly) continue;
        const tag = el.tagName.toLowerCase();
        const type = (el.type || '').toLowerCase();
        if (tag === 'input' && SKIP.has(type)) continue;
        if (!isVisible(el, type)) continue;

        if (type === 'radio') {
          const k = (el.form ? [...document.forms].indexOf(el.form) : -1) + '|' + (el.name || Math.random());
          if (!radios.has(k)) radios.set(k, []);
          radios.get(k).push(el);
          continue;
        }

        const sig = signals(el);

        if (tag === 'select') {
          if (!overwrite && el.selectedIndex > 0) continue;
          if (fillSelect(el, sig, p)) { flash(el); filled++; }
        } else if (type === 'checkbox') {
          if (!overwrite && el.checked) continue;
          if (fillCheckbox(el, sig)) filled++;
        } else {
          if (!overwrite && el.value && el.value.trim()) continue;
          let v = valueFor(el, type, sig, p);
          if (v == null) continue;
          v = String(v);
          if (el.maxLength > 0) v = v.slice(0, el.maxLength);
          setValue(el, v);
          flash(el);
          filled++;
        }
      } catch (e) { /* skip problematic field */ }
    }

    for (const group of radios.values()) {
      try {
        if (!overwrite && group.some((r) => r.checked)) continue;
        if (fillRadioGroup(group, p)) filled++;
      } catch (e) { /* ignore */ }
    }

    return { filled, total: els.length };
  };
})();
